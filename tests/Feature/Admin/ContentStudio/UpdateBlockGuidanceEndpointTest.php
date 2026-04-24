<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('updates content_guidance', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->withGuidance('old')->create();

    $this->actingAs($user)
        ->putJson(route('admin.content-studio.content.update-guidance', [$project, $block]), [
            'content_guidance' => 'Updated guidance text.',
        ])
        ->assertOk();

    expect($block->fresh()->content_guidance)->toBe('Updated guidance text.');
});

it('rejects empty guidance', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->create();

    $this->actingAs($user)
        ->putJson(route('admin.content-studio.content.update-guidance', [$project, $block]), [
            'content_guidance' => '',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['content_guidance']);
});
