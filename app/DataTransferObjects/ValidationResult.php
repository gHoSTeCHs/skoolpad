<?php

namespace App\DataTransferObjects;

final readonly class ValidationResult
{
    /** @param array<int, string> $errors */
    public function __construct(
        public bool $isValid,
        public array $errors = [],
    ) {}

    public static function pass(): self
    {
        return new self(isValid: true);
    }

    /** @param array<int, string> $errors */
    public static function fail(array $errors): self
    {
        return new self(isValid: false, errors: $errors);
    }
}
