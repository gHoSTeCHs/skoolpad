<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('clears advisory and returns refreshed project', function () {
    $user = User::factory()->admin()->create();
    $topic = CanonicalTopic::factory()->create();
    $project = ContentProject::factory()->create([
        'created_by' => $user->id,
        'progress_data' => ['blocks_approved' => ['k' => ['topic_id' => $topic->id, 'approved_at' => now()->toIso8601String()]]],
    ]);
    $source = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();
    $block = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')
        ->generated()->withAdvisory($source, 'both')->create();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.content.dismiss-advisory', [$project, $block]))
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    expect($block->fresh()->drift_advisory)->toBeNull();
});
