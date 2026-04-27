<?php

namespace App\Jobs;

use App\ContentStudio\Support\TopicGenerationLock;
use App\Enums\BlockGenerationStatus;
use App\Events\ContentGenerationUpdate;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentBlockGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RunTopicContentGeneration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Supervisor iterates up to ~30 leaf blocks sequentially at ~30-60s per block.
     * 900s accommodates a 15-block topic with slow models plus lock-release overhead.
     */
    public int $timeout = 900;

    /**
     * Never auto-retry a partial generation — the service persists state
     * per-block, and `onlyUnstarted = true` on manual re-dispatch resumes safely.
     */
    public int $tries = 1;

    public function __construct(
        public readonly ContentProject $project,
        public readonly CanonicalTopic $topic,
        public readonly string $jobId,
        public readonly ?string $modelId = null,
        public readonly bool $onlyUnstarted = true,
    ) {}

    public function handle(\Illuminate\Contracts\Container\Container $container): void
    {
        if (! TopicGenerationLock::acquire($this->topic->id)) {
            Log::info('Topic generation already in progress; skipping', ['topic_id' => $this->topic->id]);

            return;
        }

        $pendingFailures = [];

        try {
            $this->broadcastUpdate('status', [
                'message' => "Starting content generation for topic: {$this->topic->title}",
            ]);

            $this->project->loadMissing('curriculumSubject');

            $query = ContentBlock::query()
                ->where('canonical_topic_id', $this->topic->id)
                ->where('is_container', false);

            if ($this->onlyUnstarted) {
                $query->where('generation_status', BlockGenerationStatus::NotStarted->value);
            }

            $blocks = $query
                ->get()
                ->sortBy(fn (ContentBlock $b) => ContentBlockGenerationService::pathKey($b->path))
                ->values();

            // Set the initial topic relation; refreshed before each block in the loop below
            // so assembleContext always has the latest glossary after each generation.
            $blocks->each(fn (ContentBlock $b) => $b->setRelation('canonicalTopic', $this->topic));

            $service = $container->make(ContentBlockGenerationService::class);
            $total = $blocks->count();

            foreach ($blocks as $i => $block) {
                // Refresh the topic before each block so assembleContext sees the latest glossary
                // (generateBlockContent updates the glossary in the DB after each block).
                $this->topic->refresh();
                $block->setRelation('canonicalTopic', $this->topic);

                $this->broadcastUpdate('status', [
                    'block_id' => $block->id,
                    'message' => 'Generating block '.($i + 1)."/{$total}: {$block->title}",
                ]);

                try {
                    $response = $service->generateBlockContent($block, $this->project, $this->modelId);
                    $this->broadcastUpdate('complete', [
                        'block_id' => $block->id,
                        'generation_log_id' => $response->generation_log_id,
                    ]);
                } catch (\DomainException $e) {
                    Log::warning('Supervisor continued past per-block failure', [
                        'project_id' => $this->project->id, 'block_id' => $block->id, 'error' => $e->getMessage(),
                    ]);
                    $pendingFailures[$block->id] = ['reason' => 'validation_exhausted', 'error_message' => $e->getMessage(), 'attempted_at' => now()->toIso8601String()];
                    $this->broadcastUpdate('error', [
                        'block_id' => $block->id,
                        'message' => 'Block generation failed. Check project logs for details.',
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Unexpected per-block error in topic supervisor', [
                        'project_id' => $this->project->id, 'block_id' => $block->id, 'exception' => $e,
                    ]);
                    $pendingFailures[$block->id] = ['reason' => 'unknown', 'error_message' => 'Unexpected error during generation', 'attempted_at' => now()->toIso8601String()];
                    $this->broadcastUpdate('error', [
                        'block_id' => $block->id,
                        'message' => 'Unexpected error. Check project logs for details.',
                    ]);
                }
            }

            if (! empty($pendingFailures)) {
                $this->flushFailures($pendingFailures);
            }

            $this->broadcastUpdate('complete', ['message' => 'Topic content generation finished']);
        } finally {
            TopicGenerationLock::release($this->topic->id);
        }
    }

    private function broadcastUpdate(string $type, array $extra = []): void
    {
        broadcast(new ContentGenerationUpdate(
            projectId: $this->project->id,
            jobId: $this->jobId,
            type: $type,
            data: array_merge([
                'stage' => 'content',
                'topic_id' => $this->topic->id,
            ], $extra),
        ));
    }

    private function flushFailures(array $failures): void
    {
        DB::transaction(function () use ($failures) {
            $project = ContentProject::query()->lockForUpdate()->find($this->project->id);
            $context = $project->ai_context ?? [];
            $context['content_failed'] = array_merge($context['content_failed'] ?? [], $failures);
            $project->update(['ai_context' => $context]);
        });
    }
}
