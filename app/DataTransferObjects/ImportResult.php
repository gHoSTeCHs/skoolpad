<?php

namespace App\DataTransferObjects;

final readonly class ImportResult
{
    /** @param array<int, string> $errors */
    public function __construct(
        public bool $success,
        public int $totalRows,
        public int $successCount,
        public int $errorCount,
        public array $errors = [],
    ) {}
}
