<?php

namespace App\Services;

use App\ContentStudio\Prompts\ContentBlockPrompt;
use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\DataTransferObjects\ContentResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContentBlockGenerationService
{
    public const GLOSSARY_TERMS_CAP = 50;
    public const GLOSSARY_SYMBOLS_CAP = 30;

    public function __construct(
        private readonly ContentGenerationService $generation,
    ) {}

    public static function pathKey(string $path): string
    {
        return implode('.', array_map(
            fn (string $s) => str_pad($s, 6, '0', STR_PAD_LEFT),
            explode('.', $path),
        ));
    }

    public function assembleContext(ContentBlock $block, ContentProject $project): array
    {
        $topic = $block->canonicalTopic;
        $leaves = ContentBlock::query()
            ->where('canonical_topic_id', $topic->id)
            ->where('is_container', false)
            ->get()
            ->sortBy(fn (ContentBlock $b) => self::pathKey($b->path))
            ->values();

        $blockKey = self::pathKey($block->path);

        $prior = $leaves->filter(fn (ContentBlock $b) => self::pathKey($b->path) < $blockKey)->values();
        $next = $leaves->first(fn (ContentBlock $b) => self::pathKey($b->path) > $blockKey);
        $previous = $prior->last();

        $glossary = $topic->glossary ?? ['terms' => [], 'symbols' => []];
        $capped = [
            'terms' => array_slice($glossary['terms'] ?? [], 0, self::GLOSSARY_TERMS_CAP),
            'symbols' => array_slice($glossary['symbols'] ?? [], 0, self::GLOSSARY_SYMBOLS_CAP),
        ];

        if (count($glossary['terms'] ?? []) > self::GLOSSARY_TERMS_CAP
            || count($glossary['symbols'] ?? []) > self::GLOSSARY_SYMBOLS_CAP) {
            Log::warning('Glossary capped for content generation context', [
                'topic_id' => $topic->id, 'block_id' => $block->id,
                'terms_before' => count($glossary['terms'] ?? []),
                'symbols_before' => count($glossary['symbols'] ?? []),
            ]);
        }

        $subjectName = optional($project->curriculumSubject)->name ?? '';

        return [
            'topic' => [
                'title' => $topic->title,
                'summary' => $topic->summary ?? '',
                'subject' => $subjectName,
                'education_level' => (string) ($topic->education_level ?? ''),
                'estimated_total_minutes' => (int) ($topic->estimated_read_minutes ?? 0),
            ],
            'block' => [
                'title' => $block->title,
                'type' => $block->block_type?->value ?? 'text',
                'guidance' => $block->content_guidance ?? '',
                'difficulty' => optional($block->difficulty_level)->value ?? 'intermediate',
                'bloom' => optional($block->bloom_level)->value ?? 'understand',
                'read_time' => (int) ($block->estimated_read_time ?? 6),
            ],
            'hierarchy_breadcrumbs' => $this->ancestorContainerTitles($block),
            'previous_leaf' => $previous ? [
                'title' => $previous->title,
                'summary_sentence' => $previous->summary_sentence,
                'content_guidance' => $previous->content_guidance,
            ] : null,
            'next_leaf' => $next ? [
                'title' => $next->title,
                'content_guidance' => $next->content_guidance,
            ] : null,
            'glossary' => $capped,
            'prior_block_summaries' => $prior
                ->filter(fn (ContentBlock $b) => filled($b->summary_sentence))
                ->pluck('summary_sentence')->values()->all(),
        ];
    }

    private function ancestorContainerTitles(ContentBlock $block): array
    {
        $titles = [];
        $parent = $block->parent;
        while ($parent) {
            if ($parent->is_container) {
                array_unshift($titles, $parent->title);
            }
            $parent = $parent->parent;
        }

        return $titles;
    }

    public static function mergeGlossary(?array $glossary, array $newTerms, array $newSymbols, string $blockId): array
    {
        $glossary = $glossary ?? ['terms' => [], 'symbols' => []];

        $terms = collect($glossary['terms'] ?? [])
            ->reject(function (array $entry) use ($blockId, $newTerms) {
                if (($entry['first_block_id'] ?? null) !== $blockId) {
                    return false;
                }

                return ! collect($newTerms)->contains(
                    fn (array $n) => strtolower($n['term']) === strtolower($entry['term']),
                );
            })
            ->values();

        foreach ($newTerms as $new) {
            $existing = $terms->search(fn (array $e) => strtolower($e['term']) === strtolower($new['term']));

            if ($existing !== false) {
                $owned = ($terms[$existing]['first_block_id'] ?? null) === $blockId;
                if ($owned) {
                    $terms->put($existing, array_merge($terms[$existing], ['definition' => $new['definition']]));
                }
                continue;
            }

            $terms->push([
                'term' => $new['term'],
                'definition' => $new['definition'],
                'first_block_id' => $blockId,
            ]);
        }

        $symbols = collect($glossary['symbols'] ?? [])
            ->reject(function (array $entry) use ($blockId, $newSymbols) {
                if (($entry['first_block_id'] ?? null) !== $blockId) {
                    return false;
                }

                return ! collect($newSymbols)->contains(
                    fn (array $n) => $n['symbol'] === $entry['symbol'],
                );
            })
            ->values();

        foreach ($newSymbols as $new) {
            $existing = $symbols->search(fn (array $e) => $e['symbol'] === $new['symbol']);

            if ($existing !== false) {
                $owned = ($symbols[$existing]['first_block_id'] ?? null) === $blockId;
                if ($owned) {
                    $symbols->put($existing, array_merge($symbols[$existing], $new));
                }
                continue;
            }

            $symbols->push(array_merge($new, ['first_block_id' => $blockId]));
        }

        return ['terms' => $terms->values()->all(), 'symbols' => $symbols->values()->all()];
    }

    public static function compareContract(array $prior, array $new): ?array
    {
        $priorTerms = collect($prior['key_terms'] ?? [])->keyBy(fn (array $t) => strtolower($t['term']));
        $newTerms = collect($new['key_terms'] ?? [])->keyBy(fn (array $t) => strtolower($t['term']));

        $termsRemoved = $priorTerms->keys()->diff($newTerms->keys())->map(
            fn (string $k) => $priorTerms[$k]['term'],
        )->values()->all();

        $termsChanged = [];
        foreach ($newTerms as $key => $nt) {
            $pt = $priorTerms[$key] ?? null;
            if ($pt && $pt['definition'] !== $nt['definition']) {
                $termsChanged[] = $nt['term'];
            }
        }

        $priorSymbols = collect($prior['symbols'] ?? [])->keyBy('symbol');
        $newSymbols = collect($new['symbols'] ?? [])->keyBy('symbol');

        $symbolsRemoved = $priorSymbols->keys()->diff($newSymbols->keys())->values()->all();

        $symbolsChanged = false;
        foreach ($newSymbols as $sym => $ns) {
            $ps = $priorSymbols[$sym] ?? null;
            if ($ps && ($ps['quantity'] !== $ns['quantity'] || $ps['unit'] !== $ns['unit'])) {
                $symbolsChanged = true;
                break;
            }
        }

        $termsChangedFlag = count($termsRemoved) > 0 || count($termsChanged) > 0;
        $symbolsChangedFlag = count($symbolsRemoved) > 0 || $symbolsChanged;
        $summaryChanged = ($prior['summary'] ?? null) !== ($new['summary'] ?? null);

        if (! $termsChangedFlag && ! $symbolsChangedFlag && ! $summaryChanged) {
            return null;
        }

        $reasons = [];
        if ($termsChangedFlag) $reasons[] = 'key_terms';
        if ($symbolsChangedFlag) $reasons[] = 'symbols';
        if ($summaryChanged) $reasons[] = 'summary';

        return [
            'reason' => implode('+', $reasons),
            'terms_removed' => $termsRemoved,
            'terms_changed' => $termsChanged,
            'symbols_removed' => $symbolsRemoved,
        ];
    }

    public function flagDownstream(ContentBlock $source, array $diff): void
    {
        $sourceKey = self::pathKey($source->path);
        $downstream = ContentBlock::query()
            ->where('canonical_topic_id', $source->canonical_topic_id)
            ->where('is_container', false)
            ->where('id', '!=', $source->id)
            ->get()
            ->filter(fn (ContentBlock $b) => self::pathKey($b->path) > $sourceKey);

        foreach ($downstream as $block) {
            $block->update([
                'drift_advisory' => [
                    'source_block_id' => $source->id,
                    'source_block_title' => $source->title,
                    'reason' => $diff['reason'],
                    'terms_removed' => $diff['terms_removed'],
                    'terms_changed' => $diff['terms_changed'],
                    'symbols_removed' => $diff['symbols_removed'],
                    'flagged_at' => now()->toIso8601String(),
                ],
            ]);
        }
    }

    public function generateBlockContent(ContentBlock $block, ContentProject $project, ?string $modelId = null): ContentResponse
    {
        if ($block->is_container) {
            throw new \DomainException('Cannot generate content for a container block.');
        }
        if (blank($block->content_guidance)) {
            throw new \DomainException("Block {$block->id} has no content_guidance; cannot generate.");
        }

        $context = $this->assembleContext($block, $project);

        $response = $this->generation->generate(
            new ContentBlockPrompt(),
            $context,
            $project,
            $modelId ?? $project->content_model_id,
        );

        if (! $response->valid) {
            throw new \DomainException(
                'Content generation returned an invalid response: '
                . json_encode($response->validation_errors),
            );
        }

        $prior = [
            'key_terms' => $block->key_terms_introduced ?? [],
            'symbols' => $block->symbols_used ?? [],
            'summary' => $block->summary_sentence,
        ];
        $hadPrior = $block->last_generated_at !== null;

        $data = $response->data;

        DB::transaction(function () use ($block, $data, $response) {
            $block->update([
                'content' => $data['content'],
                'generation_status' => BlockGenerationStatus::Generated->value,
                'summary_sentence' => $data['summary_sentence'],
                'key_terms_introduced' => $data['key_terms_introduced'],
                'symbols_used' => $data['symbols_used'],
                'formulas_used' => $data['formulas_used'],
                'word_count' => $data['word_count'],
                'nigerian_context_used' => $data['nigerian_context_used'],
                'last_generated_at' => now(),
                'last_generation_log_id' => $response->generation_log_id,
                'drift_advisory' => null,
            ]);

            /** @var CanonicalTopic $topic */
            $topic = CanonicalTopic::query()->lockForUpdate()->find($block->canonical_topic_id);

            $merged = self::mergeGlossary(
                $topic->glossary,
                $data['key_terms_introduced'],
                $data['symbols_used'],
                $block->id,
            );

            $topic->update(['glossary' => $merged]);
        });

        if ($hadPrior) {
            $new = [
                'key_terms' => $data['key_terms_introduced'],
                'symbols' => $data['symbols_used'],
                'summary' => $data['summary_sentence'],
            ];
            $diff = self::compareContract($prior, $new);

            if ($diff !== null) {
                $this->flagDownstream($block->fresh(), $diff);
            }
        }

        return $response;
    }
}
