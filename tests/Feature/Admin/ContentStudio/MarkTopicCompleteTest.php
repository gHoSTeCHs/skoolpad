<?php

use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentProjectService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('publishes topic and all leaf blocks when every leaf is approved', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create(['is_published' => false]);
    $container = ContentBlock::factory()->container()->at('1')->for($topic, 'canonicalTopic')->create(['is_published' => false]);
    ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create(['is_published' => false]);
    ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->approved()->create(['is_published' => false]);

    app(ContentProjectService::class)->markTopicComplete($project, $topic);

    expect($topic->fresh()->is_published)->toBeTrue();
    expect($topic->fresh()->contentBlocks()->where('is_container', false)->get())
        ->each(fn ($b) => $b->is_published->toBeTrue());
});

it('rejects completion when any leaf is not approved', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create();
    ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->generated()->create();

    app(ContentProjectService::class)->markTopicComplete($project, $topic);
})->throws(\DomainException::class);

it('rejects completion when topic has no leaf blocks', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    app(ContentProjectService::class)->markTopicComplete($project, $topic);
})->throws(\DomainException::class);
