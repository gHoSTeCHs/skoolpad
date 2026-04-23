<?php

namespace App\ContentStudio\Prompts;

use App\DataTransferObjects\ContentPrompt;

abstract class ContentPromptTemplate
{
    abstract public function promptType(): string;

    abstract public function systemPrompt(): string;

    abstract public function userPrompt(array $context): string;

    abstract public function jsonSchema(): array;

    public function temperature(): float
    {
        return 0.5;
    }

    public function maxTokens(): int
    {
        return 8192;
    }

    public function build(array $context): ContentPrompt
    {
        return new ContentPrompt(
            system_prompt: $this->systemPrompt(),
            user_prompt: $this->userPrompt($context),
            json_schema: $this->jsonSchema(),
            temperature: $this->temperature(),
            max_tokens: $this->maxTokens(),
            context: $context,
        );
    }
}
