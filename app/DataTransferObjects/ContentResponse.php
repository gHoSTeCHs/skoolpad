<?php

namespace App\DataTransferObjects;

class ContentResponse
{
    public function __construct(
        public readonly bool $valid,
        public readonly array $data,
        public readonly array $validation_errors = [],
        public readonly string $raw_response = '',
        public readonly string $model_used = '',
        public readonly int $tokens_used = 0,
        public readonly float $generation_time_ms = 0,
        public readonly int $input_tokens = 0,
        public readonly int $output_tokens = 0,
        public readonly ?string $generation_log_id = null,
    ) {}
}
