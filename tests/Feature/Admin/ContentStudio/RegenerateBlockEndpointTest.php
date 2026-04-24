<?php

use App\Jobs\RunBlockContentGeneration;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('regenerates a generated block by dispatching the single-block job', function () {
    Queue::fake();
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->withGuidance('g')->generated()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.regenerate-block', [$project, $block]))
        ->assertStatus(202)
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunBlockContentGeneration::class);
});

it('regenerates an approved block', function () {
    Queue::fake();
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->withGuidance('g')->approved()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.regenerate-block', [$project, $block]))
        ->assertStatus(202);

    Queue::assertPushed(RunBlockContentGeneration::class);
});

it('returns 409 on regenerate when topic generation is already in progress', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->withGuidance('g')->approved()->create();
    \App\ContentStudio\Support\TopicGenerationLock::acquire($topic->id);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.regenerate-block', [$project, $block]))
        ->assertStatus(409);

    \App\ContentStudio\Support\TopicGenerationLock::release($topic->id);
});
