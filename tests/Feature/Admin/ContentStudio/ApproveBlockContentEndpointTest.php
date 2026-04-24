<?php

use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('approves a generated block', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.approve-block', [$project, $block]))
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    expect($block->fresh()->generation_status)->toBe(BlockGenerationStatus::Approved);
});

it('returns 422 when block is not in generated state', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->notStarted()->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.approve-block', [$project, $block]))
        ->assertUnprocessable();
});
