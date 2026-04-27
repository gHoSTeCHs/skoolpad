<?php

use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;

uses(Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

it('notStarted state creates a block at not_started', function () {
    $block = ContentBlock::factory()->notStarted()->create();

    expect($block->generation_status)->toBe(BlockGenerationStatus::NotStarted)
        ->and($block->content)->toBeNull();
});

it('generated state creates a block with content and metadata', function () {
    $block = ContentBlock::factory()->generated()->create();

    expect($block->generation_status)->toBe(BlockGenerationStatus::Generated)
        ->and($block->content)->toBeArray()
        ->and($block->summary_sentence)->not->toBeNull()
        ->and($block->key_terms_introduced)->toBeArray()
        ->and($block->last_generated_at)->not->toBeNull();
});

it('approved state creates a block ready for publishing', function () {
    $block = ContentBlock::factory()->approved()->create();

    expect($block->generation_status)->toBe(BlockGenerationStatus::Approved)
        ->and($block->content)->toBeArray();
});

it('leaf state sets is_container=false', function () {
    $block = ContentBlock::factory()->leaf()->create();
    expect($block->is_container)->toBeFalse();
});

// container() state already exists in the codebase; not re-added here.

it('at helper sets path and recomputes sort_order', function () {
    $block = ContentBlock::factory()->at('1.2.3')->create();
    expect($block->path)->toBe('1.2.3')->and($block->depth_level)->toBe(2);
});

it('withGuidance sets content_guidance', function () {
    $block = ContentBlock::factory()->withGuidance('Test guidance')->create();
    expect($block->content_guidance)->toBe('Test guidance');
});

it('withAdvisory sets drift_advisory pointing to source block', function () {
    $source = ContentBlock::factory()->create();
    $block = ContentBlock::factory()->withAdvisory($source, 'both')->create();

    expect($block->drift_advisory)->toBeArray()
        ->and($block->drift_advisory['source_block_id'])->toBe($source->id)
        ->and($block->drift_advisory['reason'])->toBe('both');
});

it('CanonicalTopic::withGlossary state persists glossary', function () {
    $topic = CanonicalTopic::factory()->withGlossary(
        terms: [['term' => 'speed', 'definition' => 'rate', 'first_block_id' => 'b1']],
        symbols: [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s', 'first_block_id' => 'b1']],
    )->create();

    expect($topic->glossary['terms'])->toHaveCount(1)
        ->and($topic->glossary['symbols'])->toHaveCount(1);
});
