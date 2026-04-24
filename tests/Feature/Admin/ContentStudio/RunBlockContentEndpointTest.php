<?php

use App\ContentStudio\Support\TopicGenerationLock;
use App\Jobs\RunBlockContentGeneration;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('dispatches RunBlockContentGeneration and returns 202', function () {
    Queue::fake();
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->withGuidance('g')->notStarted()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.run-block', [$project, $block]))
        ->assertStatus(202)
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunBlockContentGeneration::class);
});

it('returns 409 when topic generation is already in progress (block endpoint too)', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->withGuidance('g')->notStarted()->create();
    TopicGenerationLock::acquire($topic->id);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.run-block', [$project, $block]))
        ->assertStatus(409);

    TopicGenerationLock::release($topic->id);
});
