<?php

namespace App\Services;

use App\ContentStudio\Prompts\BlockStructurePrompt;
use App\ContentStudio\Prompts\CurriculumParserPrompt;
use App\ContentStudio\Prompts\SchemeOfWorkPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Enums\ContentProjectStatus;
use App\Models\AIGenerationLog;
use App\Models\CanonicalTopic;
use App\Models\ContentProject;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Services\Admin\ContentBlockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentProjectService
{
    public function __construct(
        private readonly ContentGenerationService $generationService,
        private readonly ContentBlockService $blockService,
    ) {}

    public function runCurriculumResearch(ContentProject $project, string $documentText, ?string $modelId = null): ContentResponse
    {
        $this->ensureStatus($project, [ContentProjectStatus::Draft, ContentProjectStatus::Research]);

        $subjectName = $this->resolveSubjectName($project);
        $educationLevel = $this->resolveEducationLevel($project);

        $prompt = new CurriculumParserPrompt;
        $context = [
            'document_text' => $documentText,
            'education_level' => $educationLevel,
            'subject_name' => $subjectName,
        ];

        $response = $this->generationService->generate($prompt, $context, $project, $modelId);

        if ($response->valid) {
            $project->updateAiContext('research', $response->data);
            $project->update(['status' => ContentProjectStatus::Research]);
            $this->rememberStageModel($project, 'research', $response->generation_log_id);
        } else {
            $project->updateAiContext('research_failed', [
                'raw_response' => $response->raw_response,
                'validation_errors' => $response->validation_errors,
            ]);
        }

        return $response;
    }

    public function approveResearch(ContentProject $project, array $editedTopics): void
    {
        $this->ensureStatus($project, [ContentProjectStatus::Research]);

        if (! $project->hasResearch()) {
            throw new \DomainException('No research results to approve. Run curriculum research first.');
        }

        DB::transaction(function () use ($project, $editedTopics) {
            $project->updateAiContext('research_approved', $editedTopics);
            $project->updateProgressData('research_approved_at', now()->toISOString());
        });
    }

    public function runSchemeGeneration(ContentProject $project, array $calendarConfig, ?string $modelId = null): ContentResponse
    {
        $this->ensureStatus($project, [ContentProjectStatus::Research]);

        if (! $project->hasApprovedResearch()) {
            throw new \DomainException('Research must be approved before generating a scheme of work.');
        }

        $subjectName = $this->resolveSubjectName($project);
        $educationLevel = $this->resolveEducationLevel($project);

        $approvedTopics = $this->flattenApprovedTopics($project->ai_context['research_approved']);

        $prompt = new SchemeOfWorkPrompt;
        $context = [
            'education_level' => $educationLevel,
            'subject_name' => $subjectName,
            'topics' => $approvedTopics,
            'terms_count' => $calendarConfig['terms_count'],
            'weeks_per_term' => $calendarConfig['weeks_per_term'],
            'periods_per_week' => $calendarConfig['periods_per_week'] ?? 4,
            'minutes_per_period' => $calendarConfig['minutes_per_period'] ?? 40,
        ];

        $response = $this->generationService->generate($prompt, $context, $project, $modelId);

        if ($response->valid) {
            $project->updateAiContext('scheme', $response->data);
            $this->rememberStageModel($project, 'scheme', $response->generation_log_id);
        } else {
            $project->updateAiContext('scheme_failed', [
                'raw_response' => $response->raw_response,
                'validation_errors' => $response->validation_errors,
            ]);
        }

        return $response;
    }

    public function approveScheme(ContentProject $project, array $editedScheme): void
    {
        $this->ensureStatus($project, [ContentProjectStatus::Research]);

        if (! $project->hasScheme()) {
            throw new \DomainException('No scheme of work to approve. Generate one first.');
        }

        DB::transaction(function () use ($project, $editedScheme) {
            $levelSubject = $this->resolveLevelSubject($project);

            SchemeOfWorkItem::query()
                ->where('curriculum_subject_level_id', $levelSubject->id)
                ->delete();

            $weekTopics = [];
            foreach ($editedScheme as $term) {
                $termNumber = $term['term_number'];

                foreach ($term['topics'] as $topic) {
                    for ($week = $topic['week_start']; $week <= $topic['week_end']; $week++) {
                        $key = "{$termNumber}-{$week}";
                        $weekTopics[$key] ??= ['term' => $termNumber, 'week' => $week, 'labels' => []];
                        $weekTopics[$key]['labels'][] = $topic['title'];
                    }
                }
            }

            $now = now();
            $rows = array_map(fn ($entry) => [
                'id' => (string) Str::uuid(),
                'curriculum_subject_level_id' => $levelSubject->id,
                'term' => $entry['term'],
                'week_number' => $entry['week'],
                'topic_label' => implode(' / ', $entry['labels']),
                'created_at' => $now,
                'updated_at' => $now,
            ], array_values($weekTopics));

            SchemeOfWorkItem::query()->insert($rows);

            $project->updateAiContext('scheme_approved', $editedScheme);
            $project->update(['status' => ContentProjectStatus::Structuring]);
            $project->updateProgressData('scheme_approved_at', now()->toISOString());
        });
    }

    public function skipScheme(ContentProject $project): void
    {
        if (! $project->isTertiary()) {
            throw new \DomainException('Only tertiary projects can skip the scheme of work stage.');
        }

        $this->ensureStatus($project, [ContentProjectStatus::Research]);

        if (! $project->hasApprovedResearch()) {
            throw new \DomainException('Research must be approved before skipping to block structure.');
        }

        DB::transaction(function () use ($project) {
            $project->update(['status' => ContentProjectStatus::Structuring]);
            $project->updateProgressData('scheme_skipped', true);
            $project->updateProgressData('scheme_skipped_at', now()->toISOString());
        });
    }

    public function runBlockStructure(ContentProject $project, string $topicKey, ?string $modelId = null): ContentResponse
    {
        $this->ensureStatus($project, [ContentProjectStatus::Structuring]);

        $allTopics = $this->getOrderedTopicList($project);
        $topicIndex = array_search($topicKey, array_column($allTopics, 'key'), true);

        if ($topicIndex === false) {
            throw new \DomainException("Topic '{$topicKey}' not found in project.");
        }

        $topicData = $allTopics[$topicIndex];
        $subjectName = $this->resolveSubjectName($project);
        $educationLevel = $this->resolveEducationLevel($project);

        $prerequisites = $topicIndex > 0
            ? array_map(fn ($t) => $t['title'], array_slice($allTopics, 0, $topicIndex))
            : [];
        $nextTopic = isset($allTopics[$topicIndex + 1]) ? $allTopics[$topicIndex + 1]['title'] : null;

        $prompt = new BlockStructurePrompt;
        $context = [
            'subject' => $subjectName,
            'education_level' => $educationLevel,
            'topic_title' => $topicData['title'],
            'term_number' => $topicData['term_number'] ?? null,
            'week_number' => $topicData['week_start'] ?? null,
            'periods' => $topicData['periods'] ?? null,
            'sub_topics' => $topicData['sub_topics'] ?? [],
            'waec_alignment_note' => $topicData['waec_alignment_note'] ?? null,
            'prerequisites' => $prerequisites,
            'next_topic' => $nextTopic,
        ];

        $response = $this->generationService->generate($prompt, $context, $project, $modelId);

        if ($response->valid) {
            $blocks = $project->ai_context['blocks'] ?? [];
            $blocks[$topicKey] = $response->data;
            $project->updateAiContext('blocks', $blocks);
            $this->rememberStageModel($project, 'blocks', $response->generation_log_id);
        } else {
            $failed = $project->ai_context['blocks_failed'] ?? [];
            $failed[$topicKey] = [
                'raw_response' => $response->raw_response,
                'validation_errors' => $response->validation_errors,
            ];
            $project->updateAiContext('blocks_failed', $failed);
        }

        return $response;
    }

    public function approveBlockStructure(ContentProject $project, string $topicKey, array $data): void
    {
        $this->ensureStatus($project, [ContentProjectStatus::Structuring]);

        if ($project->isBlockApproved($topicKey)) {
            throw new \DomainException("Topic '{$topicKey}' has already been approved.");
        }

        $blockStructure = $project->getBlockStructure($topicKey);
        if (! $blockStructure && empty($data['blocks'])) {
            throw new \DomainException("No block structure for topic '{$topicKey}'. Generate one first.");
        }

        DB::transaction(function () use ($project, $topicKey, $data) {
            $discipline = $project->discipline ?? $project->curriculumSubject?->discipline;

            if (! $discipline) {
                throw new \DomainException('Cannot determine discipline for this project.');
            }

            $baseSlug = $data['topic_slug'] ?? Str::slug($data['topic_title']);
            $slug = $baseSlug;
            $suffix = 1;
            while (CanonicalTopic::query()->where('discipline_id', $discipline->id)->where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$suffix}";
                $suffix++;
            }

            $topic = CanonicalTopic::query()->create([
                'discipline_id' => $discipline->id,
                'title' => $data['topic_title'],
                'slug' => $slug,
                'summary' => $data['topic_summary'] ?? null,
                'estimated_read_minutes' => $data['estimated_total_minutes'] ?? null,
                'education_level' => $project->isSecondary() ? 'secondary' : 'tertiary',
                'is_published' => false,
            ]);

            $this->createBlocksFromStructure($topic, $data['blocks']);

            $this->linkSchemeOfWorkItems($project, $topicKey, $topic);

            $approved = $project->progress_data['blocks_approved'] ?? [];
            $approved[$topicKey] = [
                'topic_id' => $topic->id,
                'approved_at' => now()->toISOString(),
            ];
            $project->updateProgressData('blocks_approved', $approved);
        });
    }

    private function createBlocksFromStructure(CanonicalTopic $topic, array $blocks): void
    {
        $createdBlocks = [];

        $processingOrder = array_keys($blocks);
        usort($processingOrder, fn ($a, $b) => ($blocks[$a]['depth_level'] ?? 0) <=> ($blocks[$b]['depth_level'] ?? 0));

        foreach ($processingOrder as $index) {
            $blockData = $blocks[$index];
            $parentBlockId = null;

            if ($blockData['parent_index'] !== null && isset($createdBlocks[$blockData['parent_index']])) {
                $parentBlockId = $createdBlocks[$blockData['parent_index']]->id;
            }

            $vizConfig = null;
            if (! empty($blockData['visualization']['recommended'])) {
                $vizConfig = $blockData['visualization'];
            }

            $block = $this->blockService->createBlock($topic, [
                'title' => $blockData['title'],
                'slug' => $blockData['slug'] ?? Str::slug($blockData['title']),
                'block_type' => $blockData['block_type'],
                'is_container' => $blockData['is_container'],
                'parent_block_id' => $parentBlockId,
                'estimated_read_time' => $blockData['estimated_read_time'] ?? null,
                'difficulty_level' => $blockData['difficulty_level'] ?? null,
                'bloom_level' => $blockData['bloom_level'] ?? null,
                'visualization_config' => $vizConfig,
            ]);

            $createdBlocks[$index] = $block;
        }
    }

    private function linkSchemeOfWorkItems(ContentProject $project, string $topicKey, CanonicalTopic $topic): void
    {
        if (! $project->isSecondary()) {
            return;
        }

        $levelSubject = $this->resolveLevelSubject($project);
        $approvedScheme = $project->ai_context['scheme_approved'] ?? [];

        foreach ($approvedScheme as $term) {
            foreach ($term['topics'] as $schemeTopic) {
                if (Str::slug($schemeTopic['title']) === $topicKey || $schemeTopic['title'] === $topicKey) {
                    SchemeOfWorkItem::query()
                        ->where('curriculum_subject_level_id', $levelSubject->id)
                        ->where('topic_label', $schemeTopic['title'])
                        ->whereNull('canonical_topic_id')
                        ->update(['canonical_topic_id' => $topic->id]);

                    return;
                }
            }
        }
    }

    private function resolveLevelSubject(ContentProject $project): LevelSubject
    {
        if (! $project->education_level_id || ! $project->curriculum_subject_id) {
            throw new \DomainException('Cannot resolve LevelSubject: project missing education_level_id or curriculum_subject_id.');
        }

        return LevelSubject::query()->firstOrCreate([
            'education_level_id' => $project->education_level_id,
            'curriculum_subject_id' => $project->curriculum_subject_id,
        ]);
    }

    private function resolveSubjectName(ContentProject $project): string
    {
        if ($project->isSecondary()) {
            $project->loadMissing('curriculumSubject');

            return $project->curriculumSubject?->name ?? 'Unknown Subject';
        }

        $project->loadMissing('discipline');

        return $project->discipline?->name ?? 'Unknown Discipline';
    }

    private function resolveEducationLevel(ContentProject $project): string
    {
        if ($project->isSecondary()) {
            $project->loadMissing('educationLevel');

            return $project->educationLevel?->display_name ?? $project->educationLevel?->name ?? 'Unknown Level';
        }

        return 'Tertiary';
    }

    /** @return array<int, array{key: string, title: string, term_number: int|null, week_start: int|null, sub_topics: array, periods: int|null, waec_alignment_note: string|null}> */
    private function getOrderedTopicList(ContentProject $project): array
    {
        $approvedScheme = $project->ai_context['scheme_approved'] ?? null;
        $approvedResearch = $project->ai_context['research_approved'] ?? null;

        if ($approvedScheme) {
            $topics = [];
            foreach ($approvedScheme as $term) {
                foreach ($term['topics'] as $topic) {
                    $researchTopic = $this->findResearchTopic($approvedResearch, $topic['title']);
                    $topics[] = [
                        'key' => Str::slug($topic['title']),
                        'title' => $topic['title'],
                        'term_number' => $term['term_number'],
                        'week_start' => $topic['week_start'],
                        'periods' => $topic['periods'],
                        'sub_topics' => $researchTopic['sub_topics'] ?? [],
                        'waec_alignment_note' => $researchTopic['waec_alignment_note'] ?? null,
                    ];
                }
            }

            return $topics;
        }

        if ($approvedResearch) {
            return array_map(fn ($topic) => [
                'key' => Str::slug($topic['title']),
                'title' => $topic['title'],
                'term_number' => $topic['term_number'] ?? null,
                'week_start' => null,
                'periods' => null,
                'sub_topics' => $topic['sub_topics'] ?? [],
                'waec_alignment_note' => $topic['waec_alignment_note'] ?? null,
            ], $approvedResearch);
        }

        return [];
    }

    private function getTopicByKey(ContentProject $project, string $topicKey): array
    {
        $topics = $this->getOrderedTopicList($project);

        foreach ($topics as $topic) {
            if ($topic['key'] === $topicKey) {
                return $topic;
            }
        }

        throw new \DomainException("Topic '{$topicKey}' not found in project.");
    }

    private function findResearchTopic(?array $approvedResearch, string $title): ?array
    {
        if (! $approvedResearch) {
            return null;
        }

        foreach ($approvedResearch as $topic) {
            if ($topic['title'] === $title) {
                return $topic;
            }
        }

        return null;
    }

    /** @return list<array{title: string, sub_topics: array, estimated_hours: numeric|null}> */
    private function flattenApprovedTopics(array $approvedTopics): array
    {
        return array_map(fn ($topic) => [
            'title' => $topic['title'],
            'sub_topics' => $topic['sub_topics'] ?? [],
            'estimated_hours' => $topic['estimated_hours'] ?? null,
            'term_number' => $topic['term_number'] ?? null,
        ], $approvedTopics);
    }

    /** @param list<ContentProjectStatus> $allowed */
    private function ensureStatus(ContentProject $project, array $allowed): void
    {
        if (! in_array($project->status, $allowed, true)) {
            $allowedLabels = implode(', ', array_map(fn ($s) => $s->label(), $allowed));
            throw new \DomainException("This action requires the project to be in one of these statuses: {$allowedLabels}. Current status: {$project->status->label()}.");
        }
    }

    private function rememberStageModel(ContentProject $project, string $stage, ?string $generationLogId): void
    {
        if (! $generationLogId) {
            return;
        }

        $column = match ($stage) {
            'research' => 'research_model_id',
            'scheme' => 'scheme_model_id',
            'blocks' => 'blocks_model_id',
            default => null,
        };

        if (! $column) {
            return;
        }

        $aiModelId = AIGenerationLog::query()->whereKey($generationLogId)->value('ai_model_id');

        if ($aiModelId) {
            $project->update([$column => $aiModelId]);
        }
    }
}
