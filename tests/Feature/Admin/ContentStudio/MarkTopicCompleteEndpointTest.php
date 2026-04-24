<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('publishes a topic when all leaves are approved', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create(['is_published' => false]);
    ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create();
    ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->approved()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.mark-topic-complete', [$project, $topic]))
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    expect($topic->fresh()->is_published)->toBeTrue();
});

it('returns 422 when a leaf is not approved', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create();
    ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.mark-topic-complete', [$project, $topic]))
        ->assertUnprocessable();
});
