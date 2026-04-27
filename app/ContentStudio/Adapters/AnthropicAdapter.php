<?php

namespace App\ContentStudio\Adapters;

use App\ContentStudio\ContentAIProvider;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Models\AIModel;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class AnthropicAdapter implements ContentAIProvider
{
    use ParsesJsonResponse;

    public function __construct(private readonly AIModel $model) {}

    public function generate(ContentPrompt $prompt): ContentResponse
    {
        $provider = $this->model->provider;
        if (empty($provider->api_key)) {
            return new ContentResponse(
                valid: false,
                data: [],
                validation_errors: ['config_error' => "API key not configured for {$this->model->name}."],
                raw_response: '',
                model_used: $this->model->model_id,
            );
        }

        $startTime = microtime(true);

        try {
            $body = [
                'model' => $this->model->model_id,
                'max_tokens' => $prompt->max_tokens,
                'temperature' => $prompt->temperature,
                'system' => $prompt->system_prompt,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt->user_prompt],
                ],
            ];

            if ($provider->supports_thinking) {
                if ($this->model->thinking_mode === \App\Enums\ThinkingMode::None) {
                    $body['thinking'] = ['type' => 'disabled'];
                } else {
                    $budgetTokens = $this->model->thinking_mode === \App\Enums\ThinkingMode::Max ? 32000 : 8000;
                    $body['thinking'] = ['type' => 'enabled', 'budget_tokens' => $budgetTokens];
                    unset($body['temperature']);
                }
            }

            $response = Http::withHeaders([
                'x-api-key' => $provider->api_key,
                'anthropic-version' => '2023-06-01',
            ])->timeout(120)->post(rtrim($provider->base_url, '/').'/messages', $body);

            $elapsedMs = (microtime(true) - $startTime) * 1000;
            $responseBody = $response->json();

            if ($response->failed()) {
                return new ContentResponse(
                    valid: false,
                    data: [],
                    validation_errors: ['api_error' => $this->extractErrorMessage($responseBody, $response->body())],
                    raw_response: $response->body(),
                    model_used: $this->model->model_id,
                    tokens_used: 0,
                    generation_time_ms: $elapsedMs,
                );
            }

            $rawText = $responseBody['content'][0]['text'] ?? '';
            $inputTokens = $responseBody['usage']['input_tokens'] ?? 0;
            $outputTokens = $responseBody['usage']['output_tokens'] ?? 0;
            $tokensUsed = $inputTokens + $outputTokens;

            return $this->parseResponse($rawText, $tokensUsed, $inputTokens, $outputTokens, $elapsedMs);
        } catch (ConnectionException $e) {
            return new ContentResponse(
                valid: false,
                data: [],
                validation_errors: ['connection_error' => $e->getMessage()],
                raw_response: '',
                model_used: $this->model->model_id,
                tokens_used: 0,
                generation_time_ms: (microtime(true) - $startTime) * 1000,
            );
        }
    }
}
