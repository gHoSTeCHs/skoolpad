<?php

use App\ContentStudio\Prompts\CurriculumParserPrompt;
use App\DataTransferObjects\ContentPrompt;

uses(Tests\TestCase::class);

it('returns research as prompt type', function () {
    $prompt = new CurriculumParserPrompt;

    expect($prompt->promptType())->toBe('research');
});

it('uses research temperature from config', function () {
    config(['content-studio.temperature.research' => 0.6]);

    $prompt = new CurriculumParserPrompt;

    expect($prompt->temperature())->toBe(0.6);
});

it('uses 16384 max tokens for large curriculum documents', function () {
    $prompt = new CurriculumParserPrompt;

    expect($prompt->maxTokens())->toBe(16384);
});

it('builds a valid ContentPrompt with context', function () {
    $prompt = new CurriculumParserPrompt;

    $result = $prompt->build([
        'document_text' => 'Sample curriculum document with topics...',
        'education_level' => 'SS1',
        'subject_name' => 'Physics',
    ]);

    expect($result)
        ->toBeInstanceOf(ContentPrompt::class)
        ->and($result->system_prompt)->toContain('curriculum analysis assistant')
        ->and($result->user_prompt)->toContain('SS1')
        ->and($result->user_prompt)->toContain('Physics')
        ->and($result->user_prompt)->toContain('Sample curriculum document');
});

it('has a non-empty json schema with required fields', function () {
    $prompt = new CurriculumParserPrompt;
    $schema = $prompt->jsonSchema();

    expect($schema)
        ->toBeArray()
        ->not->toBeEmpty()
        ->toHaveKey('education_level')
        ->toHaveKey('subject')
        ->toHaveKey('total_topics_found')
        ->toHaveKey('source_confidence')
        ->toHaveKey('terms');
});
