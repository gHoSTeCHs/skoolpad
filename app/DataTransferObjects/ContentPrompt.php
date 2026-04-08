<?php

namespace App\DataTransferObjects;

class ContentPrompt
{
    public function __construct(
        public readonly string $system_prompt,
        public readonly string $user_prompt,
        public readonly string $expected_format = 'json',
        public readonly array $json_schema = [],
        public readonly float $temperature = 0.5,
        public readonly int $max_tokens = 8192,
        public readonly array $context = [],
    ) {}
}
