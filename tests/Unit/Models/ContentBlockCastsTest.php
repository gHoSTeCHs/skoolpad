<?php

use App\Enums\BlockGenerationStatus;
use App\Models\ContentBlock;

uses(Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

it('casts generation_status to enum', function () {
    $block = ContentBlock::factory()->create(['generation_status' => 'generated']);

    expect($block->generation_status)->toBeInstanceOf(BlockGenerationStatus::class)
        ->and($block->generation_status)->toBe(BlockGenerationStatus::Generated);
});

it('casts key_terms_introduced, symbols_used, formulas_used, drift_advisory as arrays', function () {
    $block = ContentBlock::factory()->create([
        'key_terms_introduced' => [['term' => 'speed', 'definition' => 'rate']],
        'symbols_used' => [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s']],
        'formulas_used' => ['v = d/t'],
        'drift_advisory' => ['source_block_id' => 'abc', 'reason' => 'both'],
    ]);

    expect($block->key_terms_introduced)->toBeArray()
        ->and($block->symbols_used)->toBeArray()
        ->and($block->formulas_used)->toBeArray()
        ->and($block->drift_advisory)->toBeArray();
});

it('casts nigerian_context_used as boolean and word_count as int', function () {
    $block = ContentBlock::factory()->create(['nigerian_context_used' => true, 'word_count' => 450]);

    expect($block->nigerian_context_used)->toBeTrue()
        ->and($block->word_count)->toBe(450);
});

it('allows mass-assignment of all new columns', function () {
    $block = ContentBlock::factory()->create([
        'content_guidance' => 'Cover speed and distance.',
        'summary_sentence' => 'Speed is distance over time.',
        'last_generated_at' => now(),
    ]);

    expect($block->content_guidance)->toBe('Cover speed and distance.')
        ->and($block->summary_sentence)->toBe('Speed is distance over time.')
        ->and($block->last_generated_at)->not->toBeNull();
});
