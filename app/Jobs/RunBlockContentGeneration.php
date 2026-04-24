<?php

namespace App\Jobs;

use App\Events\ContentGenerationUpdate;
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

class RunBlockContentGeneration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function __construct(
        public readonly ContentProject $project,
        public readonly ContentBlock $block,
        public readonly string $jobId,
        public readonly ?string $modelId = null,
    ) {}

    public function handle(\Illuminate\Contracts\Container\Container $container): void
    {
        $service = $container->make(ContentBlockGenerationService::class);

        $this->broadcastUpdate('status', ['message' => "Generating block: {$this->block->title}"]);

        try {
            $response = $service->generateBlockContent($this->block, $this->project, $this->modelId);

            $this->broadcastUpdate('complete', [
                'generation_log_id' => $response->generation_log_id,
            ]);
        } catch (\DomainException $e) {
            Log::warning('Block content generation failed', [
                'project_id' => $this->project->id,
                'block_id' => $this->block->id,
                'error' => $e->getMessage(),
            ]);

            $this->appendFailure('validation_exhausted', $e->getMessage());
            $this->broadcastUpdate('error', ['message' => $e->getMessage()]);
        } catch (\Throwable $e) {
            Log::error('Unexpected block content generation error', [
                'project_id' => $this->project->id,
                'block_id' => $this->block->id,
                'exception' => $e,
            ]);

            $this->appendFailure('unknown', 'Unexpected error');
            $this->broadcastUpdate('error', ['message' => 'Unexpected error']);

            throw $e;
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
                'block_id' => $this->block->id,
                'topic_id' => $this->block->canonical_topic_id,
            ], $extra),
        ));
    }

    private function appendFailure(string $reason, string $message): void
    {
        DB::transaction(function () use ($reason, $message) {
            $project = ContentProject::query()->lockForUpdate()->find($this->project->id);
            $context = $project->ai_context ?? [];
            $context['content_failed'] = $context['content_failed'] ?? [];
            $context['content_failed'][$this->block->id] = [
                'reason' => $reason,
                'error_message' => $message,
                'attempted_at' => now()->toIso8601String(),
            ];
            $project->update(['ai_context' => $context]);
        });
    }
}
