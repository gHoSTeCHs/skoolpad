<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('show() includes topicsWithBlocks for approved topics', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create(['title' => 'Motion']);
    ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create(['title' => 'Intro']);
    ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->notStarted()->withGuidance('g')->create(['title' => 'Speed']);

    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => [
            'blocks_approved' => [
                'some-key' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()],
            ],
        ],
    ]);

    $this->actingAs($user)
        ->get(route('admin.content-studio.show', $project))
        ->assertInertia(fn ($page) => $page
            ->component('admin/content-studio/show')
            ->has('topicsWithBlocks', 1)
            ->where('topicsWithBlocks.0.title', 'Motion')
            ->has('topicsWithBlocks.0.blocks', 2)
            ->where('topicsWithBlocks.0.blocks.0.title', 'Intro')
        );
});

it('show() returns empty topicsWithBlocks when no topics are approved', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->get(route('admin.content-studio.show', $project))
        ->assertInertia(fn ($page) => $page
            ->component('admin/content-studio/show')
            ->has('topicsWithBlocks', 0)
        );
});
