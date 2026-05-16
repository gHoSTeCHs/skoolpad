<?php

use App\ContentStudio\Support\TiptapDiagramScope;
use App\Models\ContentBlock;
use App\Models\ContentBlockAsset;
use App\Models\Question;

// ── diagramAssetIds ───────────────────────────────────────────────────────────

test('diagramAssetIds returns the IDs of every diagram node in a Tiptap doc', function () {
    $doc = [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'hi']]],
            ['type' => 'diagram', 'attrs' => ['assetId' => 'asset-1', 'kind' => 'circuit']],
            ['type' => 'paragraph', 'content' => [
                ['type' => 'text', 'text' => 'nested? no'],
            ]],
            ['type' => 'diagram', 'attrs' => ['assetId' => 'asset-2', 'kind' => 'free_form']],
        ],
    ];

    expect(TiptapDiagramScope::diagramAssetIds($doc))->toEqual(['asset-1', 'asset-2']);
});

test('diagramAssetIds ignores diagram nodes with null/empty assetId', function () {
    $doc = [
        'type' => 'doc',
        'content' => [
            ['type' => 'diagram', 'attrs' => ['assetId' => null]],
            ['type' => 'diagram', 'attrs' => ['assetId' => '']],
            ['type' => 'diagram', 'attrs' => ['assetId' => 'real-asset']],
        ],
    ];

    expect(TiptapDiagramScope::diagramAssetIds($doc))->toEqual(['real-asset']);
});

test('diagramAssetIds returns empty array when doc has no diagrams', function () {
    $doc = ['type' => 'doc', 'content' => [['type' => 'paragraph']]];
    expect(TiptapDiagramScope::diagramAssetIds($doc))->toBeEmpty();
});

// ── findScopeViolations ───────────────────────────────────────────────────────

test('findScopeViolations returns empty when all diagrams belong to expected owner', function () {
    $block = ContentBlock::factory()->create();
    $asset = ContentBlockAsset::factory()->create(['content_block_id' => $block->id]);

    $doc = ['type' => 'doc', 'content' => [
        ['type' => 'diagram', 'attrs' => ['assetId' => $asset->id]],
    ]];

    expect(TiptapDiagramScope::findScopeViolations($doc, 'content_block_id', $block->id))->toBeEmpty();
});

test('findScopeViolations flags asset belonging to a different content_block', function () {
    $blockA = ContentBlock::factory()->create();
    $blockB = ContentBlock::factory()->create();
    $assetOfB = ContentBlockAsset::factory()->create(['content_block_id' => $blockB->id]);

    $doc = ['type' => 'doc', 'content' => [
        ['type' => 'diagram', 'attrs' => ['assetId' => $assetOfB->id]],
    ]];

    $violations = TiptapDiagramScope::findScopeViolations($doc, 'content_block_id', $blockA->id);
    expect($violations)->toHaveCount(1);
    expect($violations[0]['asset_id'])->toBe($assetOfB->id);
    expect($violations[0]['reason'])->toContain('different content_block_id');
});

test('findScopeViolations flags nonexistent asset', function () {
    $block = ContentBlock::factory()->create();
    $ghost = '00000000-0000-0000-0000-000000000099';

    $doc = ['type' => 'doc', 'content' => [
        ['type' => 'diagram', 'attrs' => ['assetId' => $ghost]],
    ]];

    $violations = TiptapDiagramScope::findScopeViolations($doc, 'content_block_id', $block->id);
    expect($violations)->toHaveCount(1);
    expect($violations[0]['reason'])->toContain('does not exist');
});

test('findScopeViolations rejects unknown owner column', function () {
    expect(fn () => TiptapDiagramScope::findScopeViolations(['type' => 'doc'], 'fake_column', 'x'))
        ->toThrow(InvalidArgumentException::class);
});

test('findScopeViolations works for question_id scope', function () {
    $qA = Question::factory()->create();
    $qB = Question::factory()->create();
    $assetOfB = ContentBlockAsset::factory()->forQuestion($qB)->create();

    $doc = ['type' => 'doc', 'content' => [
        ['type' => 'diagram', 'attrs' => ['assetId' => $assetOfB->id]],
    ]];

    expect(TiptapDiagramScope::findScopeViolations($doc, 'question_id', $qA->id))->toHaveCount(1);
    expect(TiptapDiagramScope::findScopeViolations($doc, 'question_id', $qB->id))->toBeEmpty();
});

// ── findUnlabeledAssetIds ─────────────────────────────────────────────────────

test('findUnlabeledAssetIds returns assets with empty alt_text', function () {
    $a = ContentBlockAsset::factory()->create(['alt_text' => 'Has alt']);
    $b = ContentBlockAsset::factory()->create(['alt_text' => '']);
    $c = ContentBlockAsset::factory()->create(['alt_text' => null]);

    $doc = ['type' => 'doc', 'content' => [
        ['type' => 'diagram', 'attrs' => ['assetId' => $a->id]],
        ['type' => 'diagram', 'attrs' => ['assetId' => $b->id]],
        ['type' => 'diagram', 'attrs' => ['assetId' => $c->id]],
    ]];

    $unlabeled = TiptapDiagramScope::findUnlabeledAssetIds($doc);
    expect($unlabeled)->toHaveCount(2);
    expect($unlabeled)->toContain($b->id);
    expect($unlabeled)->toContain($c->id);
    expect($unlabeled)->not->toContain($a->id);
});

test('findUnlabeledAssetIds returns empty when all alt_text present or doc has no diagrams', function () {
    expect(TiptapDiagramScope::findUnlabeledAssetIds(['type' => 'doc', 'content' => []]))->toBeEmpty();
});
