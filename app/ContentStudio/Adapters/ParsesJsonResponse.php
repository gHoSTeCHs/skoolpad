<?php

namespace App\ContentStudio\Adapters;

use App\DataTransferObjects\ContentResponse;

trait ParsesJsonResponse
{
    private function parseResponse(string $rawText, int $tokensUsed, int $inputTokens, int $outputTokens, float $elapsedMs): ContentResponse
    {
        $jsonText = $this->stripMarkdownFences($rawText);
        $decoded = json_decode($jsonText, true);

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

    private function stripMarkdownFences(string $text): string
    {
        $trimmed = trim($text);

        if (preg_match('/^```(?:json)?\s*\n?(.*?)\n?\s*```$/si', $trimmed, $matches)) {
            return trim($matches[1]);
        }

        return $trimmed;
    }

    /**
     * Extract a human-readable error message from a variety of provider error shapes.
     *
     * Handles:
     * - OpenAI: { "error": { "message": "..." } }
     * - Anthropic: { "error": { "message": "..." } }
     * - Gemini (REST): [{ "error": { "code": 503, "message": "...", "status": "UNAVAILABLE" } }]
     * - Raw string error body
     */
    private function extractErrorMessage(mixed $body, string $fallbackBody): string
    {
        if (is_array($body)) {
            if (isset($body['error']['message'])) {
                return (string) $body['error']['message'];
            }

            if (isset($body[0]['error']['message'])) {
                return (string) $body[0]['error']['message'];
            }

            if (isset($body['error']) && is_string($body['error'])) {
                return $body['error'];
            }
        }

        $trimmedBody = trim($fallbackBody);
        if ($trimmedBody !== '' && strlen($trimmedBody) < 500) {
            return $trimmedBody;
        }

        return 'Unknown API error';
    }
}
