<?php

use App\Models\AIGenerationLog;
use App\Models\AIModel;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('persists content_block_id and canonical_topic_id on generation logs', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->create();
    $model = AIModel::factory()->create();

    $log = AIGenerationLog::query()->create([
        'content_project_id' => $project->id,
        'content_block_id' => $block->id,
        'canonical_topic_id' => $topic->id,
        'ai_model_id' => $model->id,
        'prompt_type' => 'content',
        'system_prompt' => 'sys',
        'user_prompt' => 'usr',
        'raw_response' => '{}',
        'is_valid' => true,
        'tokens_used' => 1000,
        'input_tokens' => 600,
        'output_tokens' => 400,
        'generation_time_ms' => 4200,
        'estimated_cost_cents' => 12,
        'model_used' => $model->model_id,
        'provider' => 'openai_compatible',
    ]);

    expect($log->fresh())
        ->content_block_id->toBe($block->id)
        ->canonical_topic_id->toBe($topic->id);

    expect($log->contentBlock)->not->toBeNull();
    expect($log->contentBlock->id)->toBe($block->id);
    expect($log->canonicalTopic)->not->toBeNull();
    expect($log->canonicalTopic->id)->toBe($topic->id);
});

it('exposes content_block_id and canonical_topic_id on the show page generation logs', function () {
    $admin = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $admin->id]);
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->create();
    $model = AIModel::factory()->create();

    AIGenerationLog::query()->create([
        'content_project_id' => $project->id,
        'content_block_id' => $block->id,
        'canonical_topic_id' => $topic->id,
        'ai_model_id' => $model->id,
        'prompt_type' => 'content',
        'system_prompt' => 'sys',
        'user_prompt' => 'usr',
        'raw_response' => '{}',
        'is_valid' => true,
        'tokens_used' => 1000,
        'input_tokens' => 600,
        'output_tokens' => 400,
        'generation_time_ms' => 4200,
        'estimated_cost_cents' => 12,
        'model_used' => $model->model_id,
        'provider' => 'openai_compatible',
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.content-studio.show', $project));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/content-studio/show')
            ->has('generationLogs.0', fn ($log) => $log
                ->where('content_block_id', $block->id)
                ->where('canonical_topic_id', $topic->id)
                ->etc()
            )
        );
});

it('sets content_block_id to NULL when the linked block is deleted (nullOnDelete)', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->create();
    $model = AIModel::factory()->create();

    $log = AIGenerationLog::query()->create([
        'content_project_id' => $project->id,
        'content_block_id' => $block->id,
        'canonical_topic_id' => $topic->id,
        'ai_model_id' => $model->id,
        'prompt_type' => 'content',
        'system_prompt' => 'sys',
        'user_prompt' => 'usr',
        'raw_response' => '{}',
        'is_valid' => true,
        'tokens_used' => 1,
        'input_tokens' => 1,
        'output_tokens' => 0,
        'generation_time_ms' => 1,
        'estimated_cost_cents' => 0,
        'model_used' => $model->model_id,
        'provider' => 'openai_compatible',
    ]);

    $block->delete();

    expect($log->fresh()->content_block_id)->toBeNull();
});
