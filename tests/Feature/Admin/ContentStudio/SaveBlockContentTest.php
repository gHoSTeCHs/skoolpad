<?php

use App\Enums\BlockGenerationStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Services\ContentBlockGenerationService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function validTiptap(): array
{
    return ['type' => 'doc', 'content' => [
        ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Edited prose']]],
    ]];
}

it('saves edited content without dropping approved status when contract fields unchanged', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->approved()
        ->create([
            'summary_sentence' => 'SUM',
            'key_terms_introduced' => [['term' => 'a', 'definition' => 'b']],
            'symbols_used' => [],
        ]);

    app(ContentBlockGenerationService::class)->saveBlockContent($block, [
        'content' => validTiptap(),
        'summary_sentence' => 'SUM',
        'key_terms_introduced' => [['term' => 'a', 'definition' => 'b']],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 100,
        'nigerian_context_used' => true,
    ]);

    expect($block->fresh()->generation_status)->toBe(BlockGenerationStatus::Approved);
    expect($block->fresh()->content)->toEqualCanonicalizing(validTiptap());
});

it('saves without status change and without flagging when only key_terms ORDER changed (sorted compare)', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->approved()->create([
            'summary_sentence' => 'SUM',
            'key_terms_introduced' => [
                ['term' => 'alpha', 'definition' => 'A'],
                ['term' => 'beta', 'definition' => 'B'],
            ],
            'symbols_used' => [],
        ]);
    $downstream = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->approved()->create();

    app(ContentBlockGenerationService::class)->saveBlockContent($block, [
        'content' => validTiptap(),
        'summary_sentence' => 'SUM',
        'key_terms_introduced' => [
            ['term' => 'beta', 'definition' => 'B'],
            ['term' => 'alpha', 'definition' => 'A'],
        ],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 100,
        'nigerian_context_used' => true,
    ]);

    expect($block->fresh()->generation_status)->toBe(BlockGenerationStatus::Approved);
    expect($downstream->fresh()->drift_advisory)->toBeNull();
});

it('drops approved to generated when summary_sentence changes', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create([
        'summary_sentence' => 'old summary',
        'key_terms_introduced' => [],
        'symbols_used' => [],
    ]);

    app(ContentBlockGenerationService::class)->saveBlockContent($block, [
        'content' => validTiptap(),
        'summary_sentence' => 'new summary',
        'key_terms_introduced' => [],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 100,
        'nigerian_context_used' => true,
    ]);

    expect($block->fresh()->generation_status)->toBe(BlockGenerationStatus::Generated);
});

it('drops approved to generated when key_terms_introduced definition changes', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create([
        'summary_sentence' => 'SUM',
        'key_terms_introduced' => [['term' => 'a', 'definition' => 'old']],
        'symbols_used' => [],
    ]);

    app(ContentBlockGenerationService::class)->saveBlockContent($block, [
        'content' => validTiptap(),
        'summary_sentence' => 'SUM',
        'key_terms_introduced' => [['term' => 'a', 'definition' => 'new']],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 100,
        'nigerian_context_used' => true,
    ]);

    expect($block->fresh()->generation_status)->toBe(BlockGenerationStatus::Generated);
});

it('rejects content with disallowed Tiptap node types', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();

    app(ContentBlockGenerationService::class)->saveBlockContent($block, [
        'content' => ['type' => 'doc', 'content' => [['type' => 'videoEmbed']]],
        'summary_sentence' => 'x',
        'key_terms_introduced' => [],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 1,
        'nigerian_context_used' => false,
    ]);
})->throws(\DomainException::class);

it('flags downstream blocks when contract changes on manual edit', function () {
    $topic = CanonicalTopic::factory()->create();

    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create([
        'summary_sentence' => 'old',
        'key_terms_introduced' => [['term' => 'speed', 'definition' => 'old-def']],
        'symbols_used' => [],
    ]);
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->approved()->create();
    $b3 = ContentBlock::factory()->leaf()->at('1.3')->for($topic, 'canonicalTopic')->approved()->create();

    app(ContentBlockGenerationService::class)->saveBlockContent($b1, [
        'content' => validTiptap(),
        'summary_sentence' => 'new',
        'key_terms_introduced' => [['term' => 'speed', 'definition' => 'new-def']],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 100,
        'nigerian_context_used' => true,
    ]);

    expect($b2->fresh()->drift_advisory)->not->toBeNull()
        ->and($b2->fresh()->drift_advisory['source_block_id'])->toBe($b1->id);
    expect($b3->fresh()->drift_advisory)->not->toBeNull();
});

it('updates CanonicalTopic.glossary when contract changes (manual edit reconciliation)', function () {
    $topic = CanonicalTopic::factory()->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->create([
        'summary_sentence' => 'SUM',
        'key_terms_introduced' => [['term' => 'force', 'definition' => 'push or pull']],
        'symbols_used' => [],
    ]);
    $topic->update(['glossary' => [
        'terms' => [['term' => 'force', 'definition' => 'push or pull', 'first_block_id' => $b1->id]],
        'symbols' => [],
    ]]);

    app(ContentBlockGenerationService::class)->saveBlockContent($b1, [
        'content' => validTiptap(),
        'summary_sentence' => 'SUM',
        'key_terms_introduced' => [['term' => 'momentum', 'definition' => 'mass times velocity']],
        'symbols_used' => [],
        'formulas_used' => [],
        'word_count' => 100,
        'nigerian_context_used' => true,
    ]);

    $topic->refresh();
    $terms = collect($topic->glossary['terms'])->pluck('term')->all();
    expect($terms)->toEqualCanonicalizing(['momentum']);
});
