<?php

use App\ContentStudio\Support\TopicGenerationLock;
use App\DataTransferObjects\ContentResponse;
use App\Models\AIGenerationLog;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentBlockGenerationService;
use App\Services\ContentGenerationService;
use Mockery as m;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function seedLinearTopic(int $count, CanonicalTopic $topic): array
{
    $blocks = [];
    foreach (range(1, $count) as $i) {
        $blocks[] = ContentBlock::factory()->leaf()->at("1.{$i}")
            ->for($topic, 'canonicalTopic')
            ->withGuidance("guidance {$i}")
            ->notStarted()
            ->create(['title' => "Block {$i}"]);
    }

    return $blocks;
}

function contentResponseWithTerm(string $term, string $definition, string $logId, array $symbols = []): ContentResponse
{
    return new ContentResponse(
        valid: true,
        data: [
            'block_title' => 'x',
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'x']]]]],
            'summary_sentence' => "Summary defining {$term}.",
            'key_terms_introduced' => [['term' => $term, 'definition' => $definition]],
            'symbols_used' => $symbols,
            'formulas_used' => [],
            'word_count' => 1,
            'nigerian_context_used' => true,
        ],
        validation_errors: [],
        raw_response: '',
        model_used: 'm',
        tokens_used: 0,
        generation_time_ms: 1.0,
        input_tokens: 0,
        output_tokens: 0,
        generation_log_id: $logId,
    );
}

function mockAIReturning(array $responsesInOrder): void
{
    $gen = m::mock(ContentGenerationService::class);
    foreach ($responsesInOrder as $response) {
        $gen->shouldReceive('generate')->once()->andReturn($response);
    }
    app()->instance(ContentGenerationService::class, $gen);
}

// 1
it('prevents terminology drift via glossary first-seen-wins', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    [$b1, $b2, $b3] = seedLinearTopic(3, $topic);

    $log1 = AIGenerationLog::factory()->create();
    $log3 = AIGenerationLog::factory()->create();

    mockAIReturning([
        contentResponseWithTerm('speed', 'first-definition', $log1->id),
        contentResponseWithTerm('speed', 'different-definition', $log3->id),
    ]);

    $service = app(ContentBlockGenerationService::class);
    $service->generateBlockContent($b1->fresh(), $project);
    $service->generateBlockContent($b3->fresh(), $project);

    $topic->refresh();
    expect($topic->glossary['terms'])->toHaveCount(1)
        ->and($topic->glossary['terms'][0]['definition'])->toBe('first-definition')
        ->and($topic->glossary['terms'][0]['first_block_id'])->toBe($b1->id);
});

// 2
it('prevents symbol drift via symbol registry', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    [$b1, $b2, $b3] = seedLinearTopic(3, $topic);

    $log1 = AIGenerationLog::factory()->create();
    mockAIReturning([
        contentResponseWithTerm('speed', 'rate', $log1->id, symbols: [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s']]),
    ]);

    app(ContentBlockGenerationService::class)->generateBlockContent($b1->fresh(), $project);

    $context = app(ContentBlockGenerationService::class)->assembleContext($b3->fresh(), $project);

    expect($context['glossary']['symbols'][0]['symbol'])->toBe('v');
});

// 3
it('context assembly includes full glossary from all prior blocks (redefinition prevention)', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    [$b1, $b2, $b3, $b4, $b5] = seedLinearTopic(5, $topic);

    $log = AIGenerationLog::factory()->create();
    mockAIReturning([
        contentResponseWithTerm('alpha', 'A', $log->id),
        contentResponseWithTerm('beta', 'B', $log->id),
        contentResponseWithTerm('gamma', 'C', $log->id),
        contentResponseWithTerm('delta', 'D', $log->id),
    ]);
    $service = app(ContentBlockGenerationService::class);
    $service->generateBlockContent($b1->fresh(), $project);
    $service->generateBlockContent($b2->fresh(), $project);
    $service->generateBlockContent($b3->fresh(), $project);
    $service->generateBlockContent($b4->fresh(), $project);

    $context = $service->assembleContext($b5->fresh(), $project);
    $terms = collect($context['glossary']['terms'])->pluck('term')->all();

    expect($terms)->toEqualCanonicalizing(['alpha', 'beta', 'gamma', 'delta']);
});

// 4
it('sequence context includes next_leaf.content_guidance (scope-bleed prevention)', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->withGuidance('g1')->notStarted()->create();
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->withGuidance('off-limits concept')->notStarted()->create();

    $context = app(ContentBlockGenerationService::class)->assembleContext($b1->fresh(), $project);

    expect($context['next_leaf']['content_guidance'])->toBe('off-limits concept');
});

// 5
it('regenerating a block with changed contract flags downstream blocks', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $blocks = [];
    foreach (range(1, 6) as $i) {
        $blocks[] = ContentBlock::factory()->leaf()->at("1.{$i}")->for($topic, 'canonicalTopic')->generated()->create([
            'title' => "Block {$i}",
            'content_guidance' => "g{$i}",
            'summary_sentence' => "Summary {$i}",
            'key_terms_introduced' => [['term' => "t{$i}", 'definition' => "d{$i}"]],
            'symbols_used' => [],
        ]);
    }

    $log = AIGenerationLog::factory()->create();
    mockAIReturning([contentResponseWithTerm('t3-renamed', 'd3', $log->id)]);

    app(ContentBlockGenerationService::class)->generateBlockContent($blocks[2]->fresh(), $project);

    expect($blocks[0]->fresh()->drift_advisory)->toBeNull();
    expect($blocks[1]->fresh()->drift_advisory)->toBeNull();
    expect($blocks[2]->fresh()->drift_advisory)->toBeNull();
    expect($blocks[3]->fresh()->drift_advisory)->not->toBeNull()
        ->and($blocks[3]->fresh()->drift_advisory['source_block_id'])->toBe($blocks[2]->id);
    expect($blocks[4]->fresh()->drift_advisory)->not->toBeNull();
    expect($blocks[5]->fresh()->drift_advisory)->not->toBeNull();
});

// 6
it('regenerating a block with identical contract does not flag downstream', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create([
        'title' => 'Block 1', 'content_guidance' => 'g',
        'summary_sentence' => 'Same summary',
        'key_terms_introduced' => [['term' => 'same', 'definition' => 'same']],
        'symbols_used' => [],
    ]);
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->generated()->create(['title' => 'Block 2', 'content_guidance' => 'g']);

    $log = AIGenerationLog::factory()->create();
    $resp = new ContentResponse(
        valid: true,
        data: [
            'block_title' => 'Block 1',
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'x']]]]],
            'summary_sentence' => 'Same summary',
            'key_terms_introduced' => [['term' => 'same', 'definition' => 'same']],
            'symbols_used' => [],
            'formulas_used' => [],
            'word_count' => 1,
            'nigerian_context_used' => true,
        ],
        validation_errors: [],
        raw_response: '',
        model_used: 'm',
        tokens_used: 0,
        generation_time_ms: 1.0,
        input_tokens: 0,
        output_tokens: 0,
        generation_log_id: $log->id,
    );
    mockAIReturning([$resp]);

    app(ContentBlockGenerationService::class)->generateBlockContent($b1->fresh(), $project);

    expect($b2->fresh()->drift_advisory)->toBeNull();
});

// 7
it('concurrent dispatch rejected by topic lock', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    expect(TopicGenerationLock::acquire($topic->id))->toBeTrue();
    expect(TopicGenerationLock::acquire($topic->id))->toBeFalse();

    TopicGenerationLock::release($topic->id);
});

// 8
it('glossary cap enforced at 50 terms', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();
    $oversized = [];
    for ($i = 0; $i < 80; $i++) {
        $oversized[] = ['term' => "term{$i}", 'definition' => 'd', 'first_block_id' => $b1->id];
    }
    $topic->update(['glossary' => ['terms' => $oversized, 'symbols' => []]]);

    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->withGuidance('g')->notStarted()->create();
    $context = app(ContentBlockGenerationService::class)->assembleContext($b2->fresh(), $project);

    expect($context['glossary']['terms'])->toHaveCount(ContentBlockGenerationService::GLOSSARY_TERMS_CAP);
});

// 9
it('prior block summaries passed in sequence context', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create(['summary_sentence' => 'First summary.']);
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->generated()->create(['summary_sentence' => 'Second summary.']);
    $b3 = ContentBlock::factory()->leaf()->at('1.3')->for($topic, 'canonicalTopic')->withGuidance('g')->notStarted()->create();

    $context = app(ContentBlockGenerationService::class)->assembleContext($b3->fresh(), $project);

    expect($context['prior_block_summaries'])->toEqual(['First summary.', 'Second summary.']);
});

// 10
it('allow-list rejects disallowed Tiptap node (exposed via validator)', function () {
    $doc = ['type' => 'doc', 'content' => [
        ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'ok']]],
        ['type' => 'videoEmbed'],
    ]];

    $violations = \App\ContentStudio\Support\TiptapAllowList::findViolations($doc);
    expect($violations)->toHaveCount(1)
        ->and($violations[0]['type'])->toBe('videoEmbed');
});

// 11
it('regenerating approved block that was flagged clears its advisory (via overwrite)', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $src = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->generated()->create();
    $flagged = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')
        ->withGuidance('g')->withAdvisory($src, 'both')->generated()->create();

    expect($flagged->drift_advisory)->not->toBeNull();

    $log = AIGenerationLog::factory()->create();
    mockAIReturning([contentResponseWithTerm('x', 'y', $log->id)]);

    app(ContentBlockGenerationService::class)->generateBlockContent($flagged->fresh(), $project);

    expect($flagged->fresh()->drift_advisory)->toBeNull();
});

// 12
it('supervisor is idempotent: re-dispatch skips already-generated blocks when only_unstarted=true', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $done = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->approved()->withGuidance('g')->create();
    $todo = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->notStarted()->withGuidance('g')->create();

    $service = m::mock(ContentBlockGenerationService::class);
    $service->shouldReceive('generateBlockContent')
        ->with(m::on(fn ($b) => $b->id === $todo->id), m::any(), m::any())
        ->once()
        ->andReturn(contentResponseWithTerm('x', 'y', 'log'));
    $service->shouldNotReceive('generateBlockContent')
        ->with(m::on(fn ($b) => $b->id === $done->id), m::any(), m::any());
    app()->instance(ContentBlockGenerationService::class, $service);

    (new \App\Jobs\RunTopicContentGeneration($project, $topic, 'j1', null, true))->handle(app());
});
