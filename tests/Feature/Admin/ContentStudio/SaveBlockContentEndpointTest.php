<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function validPayload(): array
{
    return [
        'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Edited prose only.']]]]],
        'word_count' => 100,
        'nigerian_context_used' => true,
    ];
}

it('saves edited block Tiptap content and returns refreshed project', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();

    $this->actingAs($user)
        ->putJson(route('admin.content-studio.content.save-block', [$project, $block]), validPayload())
        ->assertOk()
        ->assertJsonStructure(['project', 'message']);

    $fresh = $block->fresh();
    expect($fresh->content['content'][0]['content'][0]['text'])->toBe('Edited prose only.');
});

it('rejects payloads with disallowed Tiptap nodes (422)', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();

    $payload = validPayload();
    $payload['content']['content'][] = ['type' => 'videoEmbed'];

    $this->actingAs($user)
        ->putJson(route('admin.content-studio.content.save-block', [$project, $block]), $payload)
        ->assertUnprocessable();
});

it('rejects payloads that attempt to edit contract fields (v1 guard, 422)', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();

    foreach ([
        'summary_sentence' => 'new summary',
        'key_terms_introduced' => [['term' => 'x', 'definition' => 'y']],
        'symbols_used' => [['symbol' => 'v', 'quantity' => 'velocity', 'unit' => 'm/s']],
        'formulas_used' => ['F = ma'],
    ] as $field => $value) {
        $payload = validPayload();
        $payload[$field] = $value;

        $this->actingAs($user)
            ->putJson(route('admin.content-studio.content.save-block', [$project, $block]), $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field]);
    }
});
