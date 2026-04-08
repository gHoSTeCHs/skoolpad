<?php

namespace App\ContentStudio\Providers;

use App\ContentStudio\ContentAIProvider;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class OllamaProvider implements ContentAIProvider
{
    public function generate(ContentPrompt $prompt): ContentResponse
    {
        $config = config('content-studio.providers.ollama');
        $startTime = microtime(true);

        try {
            $response = Http::timeout(300)->post($config['base_url'] . '/api/chat', [
                'model' => $config['model'],
                'messages' => [
                    ['role' => 'system', 'content' => $prompt->system_prompt],
                    ['role' => 'user', 'content' => $prompt->user_prompt],
                ],
                'stream' => false,
                'options' => [
                    'temperature' => $prompt->temperature,
                    'num_predict' => $prompt->max_tokens,
                ],
            ]);

            $elapsedMs = (microtime(true) - $startTime) * 1000;
            $body = $response->json();

            if ($response->failed()) {
                return new ContentResponse(
                    valid: false,
                    data: [],
                    validation_errors: ['api_error' => $body['error'] ?? 'Unknown Ollama error'],
                    raw_response: $response->body(),
                    model_used: $config['model'],
                    tokens_used: 0,
                    generation_time_ms: $elapsedMs,
                );
            }

            $rawText = $body['message']['content'] ?? '';
            $tokensUsed = ($body['prompt_eval_count'] ?? 0) + ($body['eval_count'] ?? 0);

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
