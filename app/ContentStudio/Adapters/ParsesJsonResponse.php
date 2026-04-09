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
}
