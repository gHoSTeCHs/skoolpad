<?php

use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('resets topic content and glossary when confirm_slug matches', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->withGlossary(terms: [['term' => 'x', 'definition' => 'y', 'first_block_id' => 'z']])->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.reset-topic', [$project, $topic]), [
            'confirm_slug' => $topic->slug,
        ])
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    expect($topic->fresh()->glossary)->toBeNull();
    expect(ContentBlock::query()->where('canonical_topic_id', $topic->id)->where('is_container', false)->first()->generation_status)
        ->toBe(BlockGenerationStatus::NotStarted);
});

it('rejects reset when confirm_slug does not match', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.reset-topic', [$project, $topic]), [
            'confirm_slug' => 'wrong-slug',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['confirm_slug']);
});
