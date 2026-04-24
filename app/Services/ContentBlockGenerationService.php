<?php

namespace App\Services;

use App\ContentStudio\Prompts\ContentBlockPrompt;
use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\DataTransferObjects\ContentResponse;
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
                    $terms[$existing]['definition'] = $new['definition'];
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
                    $symbols[$existing] = array_merge($symbols[$existing], $new);
                }
                continue;
            }

            $symbols->push(array_merge($new, ['first_block_id' => $blockId]));
        }

        return ['terms' => $terms->values()->all(), 'symbols' => $symbols->values()->all()];
    }
}
