<?php

use App\ContentStudio\Prompts\BlockStructurePrompt;
use App\DataTransferObjects\ContentPrompt;

uses(Tests\TestCase::class);

it('returns blocks as prompt type', function () {
    $prompt = new BlockStructurePrompt;

    expect($prompt->promptType())->toBe('blocks');
});

it('uses blocks temperature from config', function () {
    config(['content-studio.temperature.blocks' => 0.3]);

    $prompt = new BlockStructurePrompt;

    expect($prompt->temperature())->toBe(0.3);
});

it('builds a valid ContentPrompt with topic context', function () {
    $prompt = new BlockStructurePrompt;

    $result = $prompt->build([
        'subject' => 'Physics',
        'education_level' => 'SS1',
        'topic_title' => 'Speed, Velocity, and Acceleration',
        'term_number' => 1,
        'week_number' => 4,
        'periods' => 6,
        'sub_topics' => ['speed', 'velocity', 'acceleration'],
        'prerequisites' => ['Measurement', 'Introduction to Physics'],
        'next_topic' => 'Force',
        'waec_alignment_note' => 'WAEC frequently tests equations of motion',
    ]);

    expect($result)
        ->toBeInstanceOf(ContentPrompt::class)
        ->and($result->system_prompt)->toContain('content architect')
        ->and($result->user_prompt)->toContain('Speed, Velocity, and Acceleration')
        ->and($result->user_prompt)->toContain('Physics')
        ->and($result->user_prompt)->toContain('Measurement')
        ->and($result->user_prompt)->toContain('Force');
});

it('handles missing optional context gracefully', function () {
    $prompt = new BlockStructurePrompt;

    $result = $prompt->build([
        'subject' => 'Physics',
        'education_level' => 'SS1',
        'topic_title' => 'Introduction to Physics',
    ]);

    expect($result)
        ->toBeInstanceOf(ContentPrompt::class)
        ->and($result->user_prompt)->toContain('Introduction to Physics')
        ->and($result->user_prompt)->toContain('None — this is the first topic');
});

it('has a non-empty json schema with block validation rules', function () {
    $prompt = new BlockStructurePrompt;
    $schema = $prompt->jsonSchema();

    expect($schema)
        ->toBeArray()
        ->not->toBeEmpty()
        ->toHaveKey('topic_title')
        ->toHaveKey('topic_slug')
        ->toHaveKey('blocks')
        ->toHaveKey('blocks.*.block_type')
        ->toHaveKey('blocks.*.bloom_level')
        ->toHaveKey('total_leaf_blocks');
});
