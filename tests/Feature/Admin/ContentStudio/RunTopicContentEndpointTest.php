<?php

use App\ContentStudio\Support\TopicGenerationLock;
use App\Jobs\RunTopicContentGeneration;
use App\Models\CanonicalTopic;
use App\Models\ContentProject;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('dispatches RunTopicContentGeneration and returns 202 with job_id', function () {
    Queue::fake();
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.run-topic', [$project, $topic]))
        ->assertStatus(202)
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunTopicContentGeneration::class);
});

it('returns 409 when topic generation is already in progress', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    TopicGenerationLock::acquire($topic->id);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.run-topic', [$project, $topic]))
        ->assertStatus(409);

    TopicGenerationLock::release($topic->id);
});

it('returns 403 when topic does not belong to the project (IDOR guard)', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $otherTopic = CanonicalTopic::factory()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.run-topic', [$project, $otherTopic]))
        ->assertForbidden();
});

it('returns 401 unauthenticated, 403 non-staff', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    $this->postJson(route('admin.content-studio.content.run-topic', [$project, $topic]))
        ->assertUnauthorized();

    $student = User::factory()->create();
    $this->actingAs($student)
        ->postJson(route('admin.content-studio.content.run-topic', [$project, $topic]))
        ->assertForbidden();
});
