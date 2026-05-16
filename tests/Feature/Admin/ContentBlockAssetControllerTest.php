<?php

use App\Enums\AssetKind;
use App\Models\ContentBlock;
use App\Models\ContentBlockAsset;
use App\Models\Question;
use App\Models\QuestionPaper;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->student = User::factory()->create();
});

// ── store ─────────────────────────────────────────────────────────────────────

test('admin can create a content-block-scoped asset', function () {
    $block = ContentBlock::factory()->create();

    $payload = [
        'content_block_id' => $block->id,
        'kind' => AssetKind::DiagramExcalidraw->value,
        'excalidraw_json' => ['type' => 'excalidraw', 'elements' => []],
        'svg_payload' => '<svg/>',
        'alt_text' => 'Pipeline diagram',
        'caption' => 'Five-stage pipeline',
    ];

    $response = $this->actingAs($this->admin)
        ->postJson(route('admin.assets.store'), $payload);

    $response->assertCreated()
        ->assertJsonPath('asset.kind', 'diagram_excalidraw')
        ->assertJsonPath('asset.scope', 'content_block')
        ->assertJsonPath('asset.content_block_id', $block->id)
        ->assertJsonPath('asset.question_id', null)
        ->assertJsonPath('asset.question_paper_id', null)
        ->assertJsonPath('asset.alt_text', 'Pipeline diagram');

    expect(ContentBlockAsset::query()->count())->toBe(1);
    expect(ContentBlockAsset::query()->first()->created_by)->toBe($this->admin->id);
});

test('admin can create a question-scoped asset', function () {
    $question = Question::factory()->create();

    $response = $this->actingAs($this->admin)
        ->postJson(route('admin.assets.store'), [
            'question_id' => $question->id,
            'kind' => AssetKind::DiagramExcalidraw->value,
        ]);

    $response->assertCreated()
        ->assertJsonPath('asset.scope', 'question')
        ->assertJsonPath('asset.question_id', $question->id);
});

test('admin can create a question-paper-scoped asset', function () {
    $paper = QuestionPaper::factory()->create();

    $response = $this->actingAs($this->admin)
        ->postJson(route('admin.assets.store'), [
            'question_paper_id' => $paper->id,
            'kind' => AssetKind::DiagramExcalidraw->value,
        ]);

    $response->assertCreated()
        ->assertJsonPath('asset.scope', 'question_paper')
        ->assertJsonPath('asset.question_paper_id', $paper->id);
});

test('rejects asset with no owner FK set', function () {
    $response = $this->actingAs($this->admin)
        ->postJson(route('admin.assets.store'), [
            'kind' => AssetKind::DiagramExcalidraw->value,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['owner']);

    expect(ContentBlockAsset::query()->count())->toBe(0);
});

test('rejects asset with two owner FKs set', function () {
    $block = ContentBlock::factory()->create();
    $question = Question::factory()->create();

    $response = $this->actingAs($this->admin)
        ->postJson(route('admin.assets.store'), [
            'content_block_id' => $block->id,
            'question_id' => $question->id,
            'kind' => AssetKind::DiagramExcalidraw->value,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['owner']);
});

test('rejects unknown kind', function () {
    $block = ContentBlock::factory()->create();

    $this->actingAs($this->admin)
        ->postJson(route('admin.assets.store'), [
            'content_block_id' => $block->id,
            'kind' => 'totally_not_a_kind',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['kind']);
});

test('rejects nonexistent owner', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.assets.store'), [
            'content_block_id' => '00000000-0000-0000-0000-000000000000',
            'kind' => AssetKind::DiagramExcalidraw->value,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['content_block_id']);
});

// ── show ──────────────────────────────────────────────────────────────────────

test('admin can fetch an asset', function () {
    $asset = ContentBlockAsset::factory()->create();

    $this->actingAs($this->admin)
        ->getJson(route('admin.assets.show', $asset))
        ->assertOk()
        ->assertJsonPath('asset.id', $asset->id)
        ->assertJsonPath('asset.kind', 'diagram_excalidraw')
        ->assertJsonPath('asset.scope', 'content_block');
});

test('fetching a nonexistent asset 404s', function () {
    $this->actingAs($this->admin)
        ->getJson(route('admin.assets.show', '00000000-0000-0000-0000-000000000000'))
        ->assertNotFound();
});

// ── update ────────────────────────────────────────────────────────────────────

test('admin can update an asset payload + svg', function () {
    $asset = ContentBlockAsset::factory()->create([
        'svg_payload' => '<svg>old</svg>',
        'alt_text' => 'Old alt',
    ]);

    $response = $this->actingAs($this->admin)
        ->putJson(route('admin.assets.update', $asset), [
            'excalidraw_json' => ['type' => 'excalidraw', 'version' => 2, 'elements' => [['id' => 'r1', 'type' => 'rectangle']]],
            'svg_payload' => '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
            'alt_text' => 'New alt text',
            'caption' => 'Updated caption',
        ]);

    $response->assertOk()
        ->assertJsonPath('asset.id', $asset->id)
        ->assertJsonPath('asset.alt_text', 'New alt text')
        ->assertJsonPath('asset.caption', 'Updated caption')
        ->assertJsonPath('asset.svg_payload', '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')
        ->assertJsonPath('asset.excalidraw_json.elements.0.id', 'r1');
});

test('update accepts partial payload (caption only)', function () {
    $asset = ContentBlockAsset::factory()->create([
        'alt_text' => 'Untouched alt',
        'caption' => 'Old caption',
    ]);

    $this->actingAs($this->admin)
        ->putJson(route('admin.assets.update', $asset), [
            'caption' => 'Just the caption',
        ])
        ->assertOk()
        ->assertJsonPath('asset.caption', 'Just the caption')
        ->assertJsonPath('asset.alt_text', 'Untouched alt');
});

test('update does not let owner FKs change', function () {
    $asset = ContentBlockAsset::factory()->create();
    $originalBlockId = $asset->content_block_id;

    $this->actingAs($this->admin)
        ->putJson(route('admin.assets.update', $asset), [
            'content_block_id' => '00000000-0000-0000-0000-000000000000',
            'question_id' => '00000000-0000-0000-0000-000000000000',
        ])
        ->assertOk();

    expect($asset->refresh()->content_block_id)->toBe($originalBlockId);
    expect($asset->question_id)->toBeNull();
});

test('update rejects unknown kind', function () {
    $asset = ContentBlockAsset::factory()->create();

    $this->actingAs($this->admin)
        ->putJson(route('admin.assets.update', $asset), ['kind' => 'fake_kind'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['kind']);
});

// ── auth ──────────────────────────────────────────────────────────────────────

test('non-staff cannot create assets', function () {
    $block = ContentBlock::factory()->create();

    $this->actingAs($this->student)
        ->postJson(route('admin.assets.store'), [
            'content_block_id' => $block->id,
            'kind' => AssetKind::DiagramExcalidraw->value,
        ])
        ->assertForbidden();
});

test('non-staff cannot read assets', function () {
    $asset = ContentBlockAsset::factory()->create();

    $this->actingAs($this->student)
        ->getJson(route('admin.assets.show', $asset))
        ->assertForbidden();
});

test('non-staff cannot update assets', function () {
    $asset = ContentBlockAsset::factory()->create();

    $this->actingAs($this->student)
        ->putJson(route('admin.assets.update', $asset), ['caption' => 'hijacked'])
        ->assertForbidden();
});

test('guests cannot create assets', function () {
    $block = ContentBlock::factory()->create();

    $this->postJson(route('admin.assets.store'), [
        'content_block_id' => $block->id,
        'kind' => AssetKind::DiagramExcalidraw->value,
    ])
        ->assertUnauthorized();
});

// ── cascade delete ────────────────────────────────────────────────────────────

test('deleting the parent content block cascades to its assets', function () {
    $block = ContentBlock::factory()->create();
    $asset = ContentBlockAsset::factory()->create(['content_block_id' => $block->id]);

    $block->delete();

    expect(ContentBlockAsset::query()->find($asset->id))->toBeNull();
});

test('deleting the parent question cascades to its assets', function () {
    $question = Question::factory()->create();
    $asset = ContentBlockAsset::factory()->forQuestion($question)->create();

    $question->delete();

    expect(ContentBlockAsset::query()->find($asset->id))->toBeNull();
});
