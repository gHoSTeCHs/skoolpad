<?php

use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Services\ContentBlockGenerationService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('flips a generated block to approved and clears drift_advisory', function () {
    $topic = CanonicalTopic::factory()->create();
    $source = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();
    $block = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')
        ->generated()->withAdvisory($source, 'both')->create();

    app(ContentBlockGenerationService::class)->approveBlockContent($block);

    $block->refresh();
    expect($block->generation_status)->toBe(BlockGenerationStatus::Approved);
    expect($block->drift_advisory)->toBeNull();
});

it('rejects approval when block is not in generated state', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->notStarted()->create();

    app(ContentBlockGenerationService::class)->approveBlockContent($block);
})->throws(\DomainException::class);

it('is a no-op when block is already approved (idempotent)', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create();

    app(ContentBlockGenerationService::class)->approveBlockContent($block);

    expect($block->fresh()->generation_status)->toBe(BlockGenerationStatus::Approved);
});
