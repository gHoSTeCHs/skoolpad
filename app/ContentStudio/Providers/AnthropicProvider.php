<?php

namespace App\ContentStudio\Providers;

use App\ContentStudio\ContentAIProvider;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class AnthropicProvider implements ContentAIProvider
{
    public function generate(ContentPrompt $prompt): ContentResponse
    {
        $config = config('content-studio.providers.anthropic');
        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'x-api-key' => $config['api_key'],
                'anthropic-version' => '2023-06-01',
            ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
                'model' => $config['model'],
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
                    validation_errors: ['api_error' => $body['error']['message'] ?? 'Unknown API error'],
                    raw_response: $response->body(),
                    model_used: $config['model'],
                    tokens_used: 0,
                    generation_time_ms: $elapsedMs,
                );
            }

            $rawText = $body['content'][0]['text'] ?? '';
            $tokensUsed = ($body['usage']['input_tokens'] ?? 0) + ($body['usage']['output_tokens'] ?? 0);

            return $this->parseResponse($rawText, $config['model'], $tokensUsed, $elapsedMs);
        } catch (ConnectionException $e) {
            return new ContentResponse(
                valid: false,
                data: [],
                validation_errors: ['connection_error' => $e->getMessage()],
                raw_response: '',
                model_used: $config['model'],
                tokens_used: 0,
                generation_time_ms: (microtime(true) - $startTime) * 1000,
            );
        }
    }

    private function parseResponse(string $rawText, string $model, int $tokensUsed, float $elapsedMs): ContentResponse
    {
        $decoded = json_decode($rawText, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new ContentResponse(
                valid: false,
                data: [],
                validation_errors: ['json_parse_error' => json_last_error_msg()],
                raw_response: $rawText,
                model_used: $model,
                tokens_used: $tokensUsed,
                generation_time_ms: $elapsedMs,
            );
        }

        return new ContentResponse(
            valid: true,
            data: $decoded,
            raw_response: $rawText,
            model_used: $model,
            tokens_used: $tokensUsed,
            generation_time_ms: $elapsedMs,
        );
    }
}
