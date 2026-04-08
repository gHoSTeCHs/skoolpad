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
    public function __construct(private readonly AIModel $model) {}

    public function generate(ContentPrompt $prompt): ContentResponse
    {
        if (empty($this->model->api_key) && ! str_contains($this->model->base_url, 'localhost')) {
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

            if (! empty($this->model->api_key)) {
                $request = $request->withHeaders([
                    'Authorization' => 'Bearer ' . $this->model->api_key,
                ]);
            }

            $response = $request->post(rtrim($this->model->base_url, '/') . '/chat/completions', [
                'model' => $this->model->model_id,
                'max_tokens' => $prompt->max_tokens,
                'temperature' => $prompt->temperature,
                'messages' => [
                    ['role' => 'system', 'content' => $prompt->system_prompt],
                    ['role' => 'user', 'content' => $prompt->user_prompt],
                ],
            ]);

            $elapsedMs = (microtime(true) - $startTime) * 1000;
            $body = $response->json();

            if ($response->failed()) {
                return new ContentResponse(
                    valid: false,
                    data: [],
                    validation_errors: ['api_error' => $body['error']['message'] ?? 'Unknown API error'],
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

    private function parseResponse(string $rawText, int $tokensUsed, int $inputTokens, int $outputTokens, float $elapsedMs): ContentResponse
    {
        $decoded = json_decode($rawText, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new ContentResponse(
                valid: false,
                data: [],
                validation_errors: ['json_parse_error' => json_last_error_msg()],
                raw_response: $rawText,
                model_used: $this->model->model_id,
                tokens_used: $tokensUsed,
                generation_time_ms: $elapsedMs,
                input_tokens: $inputTokens,
                output_tokens: $outputTokens,
            );
        }

        return new ContentResponse(
            valid: true,
            data: $decoded,
            raw_response: $rawText,
            model_used: $this->model->model_id,
            tokens_used: $tokensUsed,
            generation_time_ms: $elapsedMs,
            input_tokens: $inputTokens,
            output_tokens: $outputTokens,
        );
    }
}
