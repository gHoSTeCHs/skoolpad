<?php

use App\ContentStudio\Prompts\SchemeOfWorkPrompt;
use App\DataTransferObjects\ContentPrompt;

uses(Tests\TestCase::class);

it('returns structure as prompt type', function () {
    $prompt = new SchemeOfWorkPrompt;

    expect($prompt->promptType())->toBe('structure');
});

it('uses structure temperature from config', function () {
    config(['content-studio.temperature.structure' => 0.3]);

    $prompt = new SchemeOfWorkPrompt;

    expect($prompt->temperature())->toBe(0.3);
});

it('builds a valid ContentPrompt with topic context', function () {
    $prompt = new SchemeOfWorkPrompt;

    $result = $prompt->build([
        'education_level' => 'SS1',
        'subject_name' => 'Physics',
        'topics' => [
            ['title' => 'Introduction to Physics', 'sub_topics' => [], 'estimated_hours' => 3],
            ['title' => 'Measurement', 'sub_topics' => ['units'], 'estimated_hours' => 4],
        ],
        'terms_count' => 3,
        'weeks_per_term' => 10,
    ]);

    expect($result)
        ->toBeInstanceOf(ContentPrompt::class)
        ->and($result->system_prompt)->toContain('curriculum planner')
        ->and($result->user_prompt)->toContain('Introduction to Physics')
        ->and($result->user_prompt)->toContain('Measurement')
        ->and($result->user_prompt)->toContain('3 terms');
});

it('has a non-empty json schema with required fields', function () {
    $prompt = new SchemeOfWorkPrompt;
    $schema = $prompt->jsonSchema();

    expect($schema)
        ->toBeArray()
        ->not->toBeEmpty()
        ->toHaveKey('terms')
        ->toHaveKey('terms.*.topics.*.week_start')
        ->toHaveKey('total_topics_allocated');
});
