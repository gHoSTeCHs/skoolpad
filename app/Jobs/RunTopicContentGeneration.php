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

            // Stamp the already-loaded topic onto each block to avoid a lazy query per block
            // inside assembleContext.
            $blocks->each(fn (ContentBlock $b) => $b->setRelation('canonicalTopic', $this->topic));

            $service = $container->make(ContentBlockGenerationService::class);
            $total = $blocks->count();

            foreach ($blocks as $i => $block) {
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
                    $this->appendFailure($block, 'validation_exhausted', $e->getMessage());
                    $this->broadcastUpdate('error', [
                        'block_id' => $block->id,
                        'message' => $e->getMessage(),
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Unexpected per-block error in topic supervisor', [
                        'project_id' => $this->project->id, 'block_id' => $block->id, 'exception' => $e,
                    ]);
                    $this->appendFailure($block, 'unknown', 'Unexpected error during generation');
                    $this->broadcastUpdate('error', [
                        'block_id' => $block->id,
                        'message' => 'Unexpected error during generation',
                    ]);
                }
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

    private function appendFailure(ContentBlock $block, string $reason, string $message): void
    {
        DB::transaction(function () use ($block, $reason, $message) {
            $project = ContentProject::query()->lockForUpdate()->find($this->project->id);
            $context = $project->ai_context ?? [];
            $context['content_failed'] = $context['content_failed'] ?? [];
            $context['content_failed'][$block->id] = [
                'reason' => $reason,
                'error_message' => $message,
                'attempted_at' => now()->toIso8601String(),
            ];
            $project->update(['ai_context' => $context]);
        });
    }
}
