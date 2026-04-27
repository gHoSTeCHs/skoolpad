<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Services\ContentBlockGenerationService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('flags only downstream leaves, not upstream or self', function () {
    $topic = CanonicalTopic::factory()->create();
    $blocks = collect();
    foreach (range(1, 5) as $i) {
        $blocks->push(ContentBlock::factory()->leaf()->at("1.{$i}")
            ->for($topic, 'canonicalTopic')->generated()->create(['title' => "Block {$i}"]));
    }

    $service = app(ContentBlockGenerationService::class);
    $service->flagDownstream($blocks[2], [
        'reason' => 'key_terms',
        'terms_removed' => ['force'],
        'terms_changed' => [],
        'symbols_removed' => [],
    ]);

    expect($blocks[0]->fresh()->drift_advisory)->toBeNull();
    expect($blocks[1]->fresh()->drift_advisory)->toBeNull();
    expect($blocks[2]->fresh()->drift_advisory)->toBeNull();
    expect($blocks[3]->fresh()->drift_advisory)->not->toBeNull();
    expect($blocks[4]->fresh()->drift_advisory)->not->toBeNull()
        ->and($blocks[4]->fresh()->drift_advisory['source_block_id'])->toBe($blocks[2]->id);
});

it('does not flag containers', function () {
    $topic = CanonicalTopic::factory()->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();
    $container = ContentBlock::factory()->container()->at('1.2')->for($topic, 'canonicalTopic')->create();
    $b3 = ContentBlock::factory()->leaf()->at('1.3')->for($topic, 'canonicalTopic')->generated()->create();

    app(ContentBlockGenerationService::class)->flagDownstream($b1, [
        'reason' => 'summary', 'terms_removed' => [], 'terms_changed' => [], 'symbols_removed' => [],
    ]);

    expect($container->fresh()->drift_advisory)->toBeNull();
    expect($b3->fresh()->drift_advisory)->not->toBeNull();
});
