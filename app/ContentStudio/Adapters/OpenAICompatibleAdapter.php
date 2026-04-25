<?php

namespace App\ContentStudio\Adapters;

use App\ContentStudio\ContentAIProvider;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Models\AIModel;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class OpenAICompatibleAdapter implements ContentAIProvider
{
    use ParsesJsonResponse;

    public function __construct(private readonly AIModel $model) {}

    public function generate(ContentPrompt $prompt): ContentResponse
    {
        $provider = $this->model->provider;
        if (empty($provider->api_key) && ! str_contains($provider->base_url, 'localhost')) {
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
            $request = Http::timeout(120);

            if (! empty($provider->api_key)) {
                $request = $request->withHeaders([
                    'Authorization' => 'Bearer '.$provider->api_key,
                ]);
            }

            $body = [
                'model' => $this->model->model_id,
                'max_tokens' => $prompt->max_tokens,
                'temperature' => $prompt->temperature,
                'messages' => [
                    ['role' => 'system', 'content' => $prompt->system_prompt],
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

            $response = $request->post(rtrim($provider->base_url, '/').'/chat/completions', $body);

            $elapsedMs = (microtime(true) - $startTime) * 1000;
            $body = $response->json();

            if ($response->failed()) {
                return new ContentResponse(
                    valid: false,
                    data: [],
                    validation_errors: ['api_error' => $this->extractErrorMessage($body, $response->body())],
                    raw_response: $response->body(),
                    model_used: $this->model->model_id,
                    tokens_used: 0,
                    generation_time_ms: $elapsedMs,
                );
            }

            $rawText = $body['choices'][0]['message']['content'] ?? '';
            $inputTokens = $body['usage']['prompt_tokens'] ?? 0;
            $outputTokens = $body['usage']['completion_tokens'] ?? 0;
            $tokensUsed = $body['usage']['total_tokens'] ?? ($inputTokens + $outputTokens);

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
