<?php

namespace App\Services;

use App\ContentStudio\ContentAIProvider;
use App\ContentStudio\Prompts\ContentPromptTemplate;
use App\ContentStudio\Providers\AnthropicProvider;
use App\ContentStudio\Providers\OllamaProvider;
use App\ContentStudio\Providers\OpenAIProvider;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Models\AIGenerationLog;
use App\Models\ContentProject;
use Illuminate\Support\Facades\Validator;

class ContentGenerationService
{
    public function generate(ContentPromptTemplate $template, array $context, ContentProject $project): ContentResponse
    {
        $prompt = $template->build($context);
        $provider = $this->resolveProvider();

        $response = $provider->generate($prompt);

        if ($response->valid) {
            $response = $this->validateSchema($response, $template->jsonSchema());
        }

        if (! $response->valid && config('content-studio.retry.validation_correction')) {
            $response = $this->retryWithCorrection($provider, $prompt, $response);
        }

        $this->logGeneration($project, $template, $prompt, $response);

        return $response;
    }

    public function generateFromPrompt(ContentPrompt $prompt, ContentProject $project, string $promptType): ContentResponse
    {
        $provider = $this->resolveProvider();

        $response = $provider->generate($prompt);

        if ($response->valid && ! empty($prompt->json_schema)) {
            $response = $this->validateSchema($response, $prompt->json_schema);
        }

        if (! $response->valid && config('content-studio.retry.validation_correction')) {
            $response = $this->retryWithCorrection($provider, $prompt, $response);
        }

        $this->logGeneration($project, null, $prompt, $response, $promptType);

        return $response;
    }

    private function resolveProvider(): ContentAIProvider
    {
        $providerName = config('content-studio.ai_provider');

        return match ($providerName) {
            'anthropic' => new AnthropicProvider(),
            'openai' => new OpenAIProvider(),
            'ollama' => new OllamaProvider(),
            default => throw new \InvalidArgumentException("Unknown AI provider: {$providerName}"),
        };
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
            );
        }

        return $response;
    }

    private function retryWithCorrection(ContentAIProvider $provider, ContentPrompt $originalPrompt, ContentResponse $failedResponse): ContentResponse
    {
        $maxAttempts = config('content-studio.retry.max_attempts', 2);

        for ($attempt = 1; $attempt < $maxAttempts; $attempt++) {
            $correctionPrompt = $this->buildCorrectionPrompt($originalPrompt, $failedResponse);
            $response = $provider->generate($correctionPrompt);

            if ($response->valid && ! empty($originalPrompt->json_schema)) {
                $response = $this->validateSchema($response, $originalPrompt->json_schema);
            }

            if ($response->valid) {
                return $response;
            }
        }

        return $failedResponse;
    }

    private function buildCorrectionPrompt(ContentPrompt $original, ContentResponse $failed): ContentPrompt
    {
        $errorSummary = collect($failed->validation_errors)
            ->map(fn ($errors, $field) => is_array($errors)
                ? "{$field}: " . implode(', ', $errors)
                : "{$field}: {$errors}"
            )
            ->implode("\n");

        $correctionText = "Your previous response had the following validation errors:\n{$errorSummary}\n\n"
            . "Please fix these errors and return the corrected JSON. Keep all other fields unchanged.\n\n"
            . "Your previous response for reference:\n{$failed->raw_response}";

        return new ContentPrompt(
            system_prompt: $original->system_prompt,
            user_prompt: $correctionText,
            expected_format: $original->expected_format,
            json_schema: $original->json_schema,
            temperature: $original->temperature,
            max_tokens: $original->max_tokens,
            context: $original->context,
        );
    }

    private function logGeneration(
        ContentProject $project,
        ?ContentPromptTemplate $template,
        ContentPrompt $prompt,
        ContentResponse $response,
        ?string $promptType = null,
    ): void {
        AIGenerationLog::query()->create([
            'content_project_id' => $project->id,
            'prompt_type' => $promptType ?? $template?->promptType() ?? 'unknown',
            'system_prompt' => $prompt->system_prompt,
            'user_prompt' => $prompt->user_prompt,
            'raw_response' => $response->raw_response,
            'parsed_data' => $response->valid ? $response->data : null,
            'is_valid' => $response->valid,
            'validation_errors' => $response->valid ? null : $response->validation_errors,
            'model_used' => $response->model_used,
            'provider' => config('content-studio.ai_provider'),
            'tokens_used' => $response->tokens_used,
            'generation_time_ms' => (int) $response->generation_time_ms,
        ]);
    }
}
