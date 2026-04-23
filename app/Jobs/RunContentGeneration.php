<?php

namespace App\Jobs;

use App\DataTransferObjects\ContentResponse;
use App\Events\ContentGenerationUpdate;
use App\Models\ContentProject;
use App\Services\ContentProjectService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RunContentGeneration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 180;

    public int $tries = 1;

    private const STAGE_LABELS = [
        'research' => 'research',
        'scheme' => 'scheme',
        'blocks' => 'block structure',
    ];

    public function __construct(
        public readonly ContentProject $project,
        public readonly string $promptType,
        public readonly array $context,
        public readonly string $jobId,
        public readonly ?string $modelId = null,
    ) {}

    public function handle(ContentProjectService $projectService): void
    {
        $startedAt = microtime(true);

        Log::info('[ContentStudio] Job started', [
            'job_id' => $this->jobId,
            'project_id' => $this->project->id,
            'prompt_type' => $this->promptType,
            'model_id' => $this->modelId,
        ]);

        try {
            $this->project->refresh();
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            Log::warning('[ContentStudio] Project deleted before job execution', [
                'job_id' => $this->jobId,
                'project_id' => $this->project->id,
            ]);

            $this->broadcastUpdate('error', [
                'stage' => $this->promptType,
                'message' => 'Project was deleted while generation was pending.',
            ]);

            return;
        }

        $this->broadcastUpdate('status', [
            'stage' => $this->promptType,
            'state' => 'processing',
            'message' => 'Calling AI provider...',
        ]);

        try {
            $response = $this->callService($projectService);

            $elapsedMs = (int) ((microtime(true) - $startedAt) * 1000);

            if ($response->valid) {
                Log::info('[ContentStudio] Job completed successfully', [
                    'job_id' => $this->jobId,
                    'project_id' => $this->project->id,
                    'prompt_type' => $this->promptType,
                    'generation_log_id' => $response->generation_log_id,
                    'elapsed_ms' => $elapsedMs,
                ]);

                $this->broadcastUpdate('complete', [
                    'stage' => $this->promptType,
                    'generation_log_id' => $response->generation_log_id,
                ]);
            } else {
                $errorMessage = $this->formatError($response);

                Log::warning('[ContentStudio] Job generation failed', [
                    'job_id' => $this->jobId,
                    'project_id' => $this->project->id,
                    'prompt_type' => $this->promptType,
                    'elapsed_ms' => $elapsedMs,
                    'message' => $errorMessage,
                ]);

                $this->broadcastUpdate('error', [
                    'stage' => $this->promptType,
                    'message' => $errorMessage,
                ]);
            }
        } catch (\DomainException $e) {
            Log::warning('[ContentStudio] Job rejected by domain guard', [
                'job_id' => $this->jobId,
                'project_id' => $this->project->id,
                'prompt_type' => $this->promptType,
                'message' => $e->getMessage(),
            ]);

            $this->broadcastUpdate('error', [
                'stage' => $this->promptType,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function failed(?\Throwable $exception): void
    {
        Log::error('[ContentStudio] Job failed (uncaught exception)', [
            'job_id' => $this->jobId,
            'project_id' => $this->project->id,
            'prompt_type' => $this->promptType,
            'exception' => $exception?->getMessage(),
            'trace' => $exception?->getTraceAsString(),
        ]);

        $this->broadcastUpdate('error', [
            'stage' => $this->promptType,
            'message' => 'Job failed: '.($exception?->getMessage() ?? 'Unknown error'),
        ]);
    }

    private function callService(ContentProjectService $service): ContentResponse
    {
        return match ($this->promptType) {
            'research' => $service->runCurriculumResearch(
                $this->project,
                $this->context['document_text'],
                $this->modelId,
            ),
            'scheme' => $service->runSchemeGeneration(
                $this->project,
                $this->context,
                $this->modelId,
            ),
            'blocks' => $service->runBlockStructure(
                $this->project,
                $this->context['topic_key'],
                $this->modelId,
            ),
            default => throw new \InvalidArgumentException("Unknown prompt type: {$this->promptType}"),
        };
    }

    private function formatError(ContentResponse $response): string
    {
        $errors = $response->validation_errors;
        $stage = self::STAGE_LABELS[$this->promptType] ?? $this->promptType;

        if (isset($errors['api_error'])) {
            return "AI provider error: {$errors['api_error']}";
        }

        if (isset($errors['connection_error'])) {
            return 'Could not reach AI provider. Check network or switch models.';
        }

        if (isset($errors['config_error'])) {
            return $errors['config_error'];
        }

        if (isset($errors['json_parse_error'])) {
            return "AI returned malformed JSON for {$stage}. The generation log has the raw response.";
        }

        return "Generated {$stage} failed schema validation. Check the generation log for details.";
    }

    private function broadcastUpdate(string $type, array $data): void
    {
        broadcast(new ContentGenerationUpdate(
            projectId: $this->project->id,
            jobId: $this->jobId,
            type: $type,
            data: $data,
        ));
    }
}
