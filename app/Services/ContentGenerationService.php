<?php

namespace App\Services;

use App\ContentStudio\Adapters\AnthropicAdapter;
use App\ContentStudio\Adapters\OpenAICompatibleAdapter;
use App\ContentStudio\ContentAIProvider;
use App\ContentStudio\Prompts\ContentPromptTemplate;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Enums\AIAdapterType;
use App\Models\AIGenerationLog;
use App\Models\AIModel;
use App\Models\ContentProject;
use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class ContentGenerationService
{
    public function generate(ContentPromptTemplate $template, array $context, ContentProject $project, ?string $modelId = null): ContentResponse
    {
        $model = $this->resolveModel($modelId, $template->promptType(), $project);
        $prompt = $template->build($context);
        $prompt = $this->capMaxTokens($prompt, $model);
        $adapter = $this->resolveAdapter($model);

        $response = $adapter->generate($prompt);

        if ($response->valid) {
            $response = $this->normalizeResponse($response, $template);
            $response = $this->validateSchema($response, $template->jsonSchema());
        }

        if (! $response->valid && $this->shouldRetry($response) && config('content-studio.retry.validation_correction')) {
            $response = $this->retryWithCorrection($adapter, $prompt, $response, fn (array $data) => $template->normalize($data));
        }

        $log = $this->logGeneration($project, $model, $template, $prompt, $response);

        return new ContentResponse(
            valid: $response->valid,
            data: $response->data,
            validation_errors: $response->validation_errors,
            raw_response: $response->raw_response,
            model_used: $response->model_used,
            tokens_used: $response->tokens_used,
            generation_time_ms: $response->generation_time_ms,
            input_tokens: $response->input_tokens,
            output_tokens: $response->output_tokens,
            generation_log_id: $log->id,
        );
    }

    public function generateFromPrompt(ContentPrompt $prompt, ContentProject $project, string $promptType, ?string $modelId = null): ContentResponse
    {
        $model = $this->resolveModel($modelId, $promptType, $project);
        $prompt = $this->capMaxTokens($prompt, $model);
        $adapter = $this->resolveAdapter($model);

        $response = $adapter->generate($prompt);

        if ($response->valid && ! empty($prompt->json_schema)) {
            $response = $this->validateSchema($response, $prompt->json_schema);
        }

        if (! $response->valid && $this->shouldRetry($response) && config('content-studio.retry.validation_correction')) {
            $response = $this->retryWithCorrection($adapter, $prompt, $response);
        }

        $log = $this->logGeneration($project, $model, null, $prompt, $response, $promptType);

        return new ContentResponse(
            valid: $response->valid,
            data: $response->data,
            validation_errors: $response->validation_errors,
            raw_response: $response->raw_response,
            model_used: $response->model_used,
            tokens_used: $response->tokens_used,
            generation_time_ms: $response->generation_time_ms,
            input_tokens: $response->input_tokens,
            output_tokens: $response->output_tokens,
            generation_log_id: $log->id,
        );
    }

    public function resolveModel(?string $modelId = null, ?string $taskType = null, ?ContentProject $project = null): AIModel
    {
        if ($modelId) {
            $model = AIModel::query()->active()->find($modelId);

            if ($model) {
                return $model;
            }
        }

        if ($project && $taskType) {
            $stageColumn = match ($taskType) {
                'research' => 'research_model_id',
                'scheme' => 'scheme_model_id',
                'blocks' => 'blocks_model_id',
                default => null,
            };

            if ($stageColumn && $project->{$stageColumn}) {
                $model = AIModel::query()->active()->find($project->{$stageColumn});

                if ($model) {
                    return $model;
                }
            }
        }

        if ($project && $project->default_ai_model_id) {
            $model = AIModel::query()->active()->find($project->default_ai_model_id);

            if ($model) {
                return $model;
            }
        }

        if ($taskType) {
            $routingMap = Cache::remember('platform_setting.ai_task_routing', 60, function () {
                return PlatformSetting::query()->where('key', 'ai_task_routing')->value('value') ?? [];
            });

            $routedModelId = is_array($routingMap) ? ($routingMap[$taskType] ?? null) : null;

            if ($routedModelId) {
                $model = AIModel::query()->active()->find($routedModelId);

                if ($model) {
                    return $model;
                }
            }
        }

        $platformDefault = Cache::remember('platform_setting.content_studio_default_model', 60, function () {
            return PlatformSetting::query()->where('key', 'content_studio.default_model_id')->value('value');
        });

        if (is_array($platformDefault) && ! empty($platformDefault['model_id'])) {
            $model = AIModel::query()->active()->find($platformDefault['model_id']);

            if ($model) {
                return $model;
            }
        }

        $fallback = AIModel::query()->active()->orderBy('sort_order')->first();

        if (! $fallback) {
            throw new \RuntimeException('No active AI models configured. Add at least one model in Content Studio settings.');
        }

        return $fallback;
    }

    public function resolveAdapter(AIModel $model): ContentAIProvider
    {
        $model->loadMissing('provider');

        return match ($model->provider->adapter_type) {
            AIAdapterType::OpenAICompatible => new OpenAICompatibleAdapter($model),
            AIAdapterType::Anthropic => new AnthropicAdapter($model),
        };
    }

    private function shouldRetry(ContentResponse $response): bool
    {
        $nonRetryable = ['connection_error', 'api_error', 'config_error'];

        foreach ($nonRetryable as $key) {
            if (isset($response->validation_errors[$key])) {
                return false;
            }
        }

        return true;
    }

    private function validateSchema(ContentResponse $response, array $schema): ContentResponse
    {
        if (empty($schema)) {
            return $response;
        }

        $validator = Validator::make($response->data, $schema);

        if ($validator->fails()) {
            return new ContentResponse(
                valid: false,
                data: $response->data,
                validation_errors: $validator->errors()->toArray(),
                raw_response: $response->raw_response,
                model_used: $response->model_used,
                tokens_used: $response->tokens_used,
                generation_time_ms: $response->generation_time_ms,
                input_tokens: $response->input_tokens,
                output_tokens: $response->output_tokens,
            );
        }

        return $response;
    }

    private function retryWithCorrection(ContentAIProvider $adapter, ContentPrompt $originalPrompt, ContentResponse $failedResponse, ?callable $normalizer = null): ContentResponse
    {
        $maxAttempts = config('content-studio.retry.max_attempts', 2);
        $lastResponse = $failedResponse;

        for ($attempt = 1; $attempt < $maxAttempts; $attempt++) {
            $correctionPrompt = $this->buildCorrectionPrompt($originalPrompt, $lastResponse);
            $lastResponse = $adapter->generate($correctionPrompt);

            if ($lastResponse->valid) {
                if ($normalizer !== null) {
                    $lastResponse = $this->applyNormalizer($lastResponse, $normalizer);
                }

                if (! empty($originalPrompt->json_schema)) {
                    $lastResponse = $this->validateSchema($lastResponse, $originalPrompt->json_schema);
                }
            }

            if ($lastResponse->valid) {
                return $lastResponse;
            }
        }

        return $lastResponse;
    }

    private function normalizeResponse(ContentResponse $response, ContentPromptTemplate $template): ContentResponse
    {
        return $this->applyNormalizer($response, fn (array $data) => $template->normalize($data));
    }

    private function applyNormalizer(ContentResponse $response, callable $normalizer): ContentResponse
    {
        $normalized = $normalizer($response->data);

        if ($normalized === $response->data) {
            return $response;
        }

        return new ContentResponse(
            valid: $response->valid,
            data: $normalized,
            validation_errors: $response->validation_errors,
            raw_response: $response->raw_response,
            model_used: $response->model_used,
            tokens_used: $response->tokens_used,
            generation_time_ms: $response->generation_time_ms,
            input_tokens: $response->input_tokens,
            output_tokens: $response->output_tokens,
        );
    }

    private function buildCorrectionPrompt(ContentPrompt $original, ContentResponse $failed): ContentPrompt
    {
        $errorSummary = collect($failed->validation_errors)
            ->map(fn ($errors, $field) => is_array($errors)
                ? "{$field}: ".implode(', ', $errors)
                : "{$field}: {$errors}"
            )
            ->implode("\n");

        $correctionText = "---\nYour previous response had the following validation errors:\n{$errorSummary}\n\n"
            ."Fix only these errors and return the corrected JSON. All other fields must remain unchanged.\n\n"
            ."Your previous response for reference:\n{$failed->raw_response}";

        return new ContentPrompt(
            system_prompt: $original->system_prompt,
            user_prompt: $original->user_prompt."\n\n".$correctionText,
            expected_format: $original->expected_format,
            json_schema: $original->json_schema,
            temperature: $original->temperature,
            max_tokens: $original->max_tokens,
            context: $original->context,
        );
    }

    private function capMaxTokens(ContentPrompt $prompt, AIModel $model): ContentPrompt
    {
        if ($prompt->max_tokens <= $model->max_tokens) {
            return $prompt;
        }

        return new ContentPrompt(
            system_prompt: $prompt->system_prompt,
            user_prompt: $prompt->user_prompt,
            expected_format: $prompt->expected_format,
            json_schema: $prompt->json_schema,
            temperature: $prompt->temperature,
            max_tokens: $model->max_tokens,
            context: $prompt->context,
        );
    }

    private function logGeneration(
        ContentProject $project,
        AIModel $model,
        ?ContentPromptTemplate $template,
        ContentPrompt $prompt,
        ContentResponse $response,
        ?string $promptType = null,
    ): AIGenerationLog {
        $inputCost = ($response->input_tokens / 1_000_000) * $model->input_cost_per_million;
        $outputCost = ($response->output_tokens / 1_000_000) * $model->output_cost_per_million;

        return AIGenerationLog::query()->create([
            'content_project_id' => $project->id,
            'ai_model_id' => $model->id,
            'prompt_type' => $promptType ?? $template?->promptType() ?? 'unknown',
            'system_prompt' => $prompt->system_prompt,
            'user_prompt' => $prompt->user_prompt,
            'raw_response' => $response->raw_response,
            'parsed_data' => $response->valid ? $response->data : null,
            'is_valid' => $response->valid,
            'validation_errors' => $response->valid ? null : $response->validation_errors,
            'model_used' => $response->model_used,
            'provider' => $model->provider->adapter_type->value,
            'tokens_used' => $response->tokens_used,
            'input_tokens' => $response->input_tokens,
            'output_tokens' => $response->output_tokens,
            'generation_time_ms' => (int) $response->generation_time_ms,
            'estimated_cost_cents' => (int) round($inputCost + $outputCost),
        ]);
    }
}
