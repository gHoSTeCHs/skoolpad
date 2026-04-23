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
        if (empty($this->model->api_key)) {
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
            $response = Http::withHeaders([
                'x-api-key' => $this->model->api_key,
                'anthropic-version' => '2023-06-01',
            ])->timeout(120)->post(rtrim($this->model->base_url, '/').'/messages', [
                'model' => $this->model->model_id,
                'max_tokens' => $prompt->max_tokens,
                'temperature' => $prompt->temperature,
                'system' => $prompt->system_prompt,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt->user_prompt],
                ],
            ]);

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

            $rawText = $body['content'][0]['text'] ?? '';
            $inputTokens = $body['usage']['input_tokens'] ?? 0;
            $outputTokens = $body['usage']['output_tokens'] ?? 0;
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
