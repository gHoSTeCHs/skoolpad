<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Services\ContentBlockGenerationService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('clears drift_advisory without changing generation_status', function () {
    $topic = CanonicalTopic::factory()->create();
    $source = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();
    $block = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')
        ->generated()->withAdvisory($source, 'both')->create();
    $statusBefore = $block->generation_status;

    app(ContentBlockGenerationService::class)->dismissBlockAdvisory($block);

    expect($block->fresh()->drift_advisory)->toBeNull();
    expect($block->fresh()->generation_status)->toBe($statusBefore);
});

it('is idempotent when no advisory is present', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();

    app(ContentBlockGenerationService::class)->dismissBlockAdvisory($block);

    expect($block->fresh()->drift_advisory)->toBeNull();
});
