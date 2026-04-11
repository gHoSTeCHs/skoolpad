<?php

namespace App\Jobs;

use App\DataTransferObjects\ContentResponse;
use App\Models\AIGenerationLog;
use App\Models\ContentProject;
use App\Services\ContentProjectService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

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
    ) {
        $this->onQueue('content-studio');
    }

    public function handle(ContentProjectService $projectService): void
    {
        try {
            $this->project->refresh();
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            $this->writeEvent('error', [
                'stage' => $this->promptType,
                'message' => 'Project was deleted while generation was pending.',
            ]);

            return;
        }

        $this->writeEvent('status', [
            'stage' => $this->promptType,
            'state' => 'processing',
            'message' => 'Calling AI provider...',
        ]);

        try {
            $response = $this->callService($projectService);

            if ($response->valid) {
                $logEntry = $response->generation_log_id
                    ? AIGenerationLog::query()
                        ->select(['id', 'prompt_type', 'model_used', 'is_valid', 'tokens_used', 'estimated_cost_cents', 'created_at'])
                        ->find($response->generation_log_id)
                    : null;

                $this->writeEvent('complete', [
                    'stage' => $this->promptType,
                    'project' => $this->project->refresh()->toShowArray(),
                    'log_entry' => $logEntry?->toArray(),
                ]);
            } else {
                $this->writeEvent('error', [
                    'stage' => $this->promptType,
                    'message' => $this->formatError($response),
                ]);
            }
        } catch (\DomainException $e) {
            $this->writeEvent('error', [
                'stage' => $this->promptType,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function failed(?\Throwable $exception): void
    {
        $this->writeEvent('error', [
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

    private function writeEvent(string $type, array $data): void
    {
        $cacheKey = "cs_job:{$this->project->id}:{$this->jobId}";
        $events = Cache::get($cacheKey, []);
        $events[] = [
            'id' => count($events) + 1,
            'type' => $type,
            'data' => $data,
            'timestamp' => now()->toISOString(),
        ];
        Cache::put($cacheKey, $events, 300);
    }
}
