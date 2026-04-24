<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Services\ContentBlockGenerationService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('updates content_guidance on a block', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->withGuidance('old')->notStarted()->create();

    app(ContentBlockGenerationService::class)->updateBlockGuidance($block, 'new guidance');

    expect($block->fresh()->content_guidance)->toBe('new guidance');
});

it('rejects updates on container blocks', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->container()->at('1')->for($topic, 'canonicalTopic')->create();

    app(ContentBlockGenerationService::class)->updateBlockGuidance($block, 'x');
})->throws(\DomainException::class);
