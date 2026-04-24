<?php

use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentProjectService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('clears content, metadata, advisory, and topic glossary for all blocks', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->withGlossary(
        terms: [['term' => 'x', 'definition' => 'y', 'first_block_id' => 'z']],
        symbols: [],
    )->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create();
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->generated()->create();

    app(ContentProjectService::class)->resetTopicContent($project, $topic);

    expect($topic->fresh()->glossary)->toBeNull();
    expect($b1->fresh()->generation_status)->toBe(BlockGenerationStatus::NotStarted);
    expect($b1->fresh()->content)->toBeNull();
    expect($b1->fresh()->summary_sentence)->toBeNull();
    expect($b1->fresh()->drift_advisory)->toBeNull();
    expect($b2->fresh()->generation_status)->toBe(BlockGenerationStatus::NotStarted);
});

it('nulls is_published and published_at when resetting a previously-published topic', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create([
        'is_published' => true,
        'published_at' => now()->subDay(),
    ]);
    ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create(['is_published' => true]);

    app(ContentProjectService::class)->resetTopicContent($project, $topic);

    $topic->refresh();
    expect($topic->is_published)->toBeFalse();
    expect($topic->published_at)->toBeNull();
});

it('rejects reset while the topic has an active generation lock', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    \App\ContentStudio\Support\TopicGenerationLock::acquire($topic->id);

    try {
        app(ContentProjectService::class)->resetTopicContent($project, $topic);
        expect(true)->toBeFalse();
    } catch (\DomainException $e) {
        expect($e->getMessage())->toContain('generation is in progress');
    } finally {
        \App\ContentStudio\Support\TopicGenerationLock::release($topic->id);
    }
});
