<?php

use App\DataTransferObjects\ContentResponse;
use App\Enums\BlockGenerationStatus;
use App\Models\AIGenerationLog;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentBlockGenerationService;
use App\Services\ContentGenerationService;
use Mockery as m;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function happyAIResponse(string $logId): ContentResponse
{
    return new ContentResponse(
        valid: true,
        data: [
            'block_title' => 'What is Speed?',
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Speed is distance per time.']]]]],
            'summary_sentence' => 'Speed is distance over time.',
            'key_terms_introduced' => [['term' => 'speed', 'definition' => 'distance per unit time']],
            'symbols_used' => [['symbol' => 'v', 'quantity' => 'speed', 'unit' => 'm/s']],
            'formulas_used' => ['v = d/t'],
            'word_count' => 20,
            'nigerian_context_used' => true,
        ],
        validation_errors: [],
        raw_response: '...',
        model_used: 'deepseek-chat',
        tokens_used: 1000,
        generation_time_ms: 4000.0,
        input_tokens: 600,
        output_tokens: 400,
        generation_log_id: $logId,
    );
}

it('persists content and metadata on success', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $log = AIGenerationLog::factory()->create();

    $block = ContentBlock::factory()->leaf()->at('1.1')
        ->for($topic, 'canonicalTopic')
        ->withGuidance('Define speed.')
        ->notStarted()
        ->create(['title' => 'What is Speed?']);

    $gen = m::mock(ContentGenerationService::class);
    $gen->shouldReceive('generate')->andReturn(happyAIResponse($log->id));
    app()->instance(ContentGenerationService::class, $gen);

    $service = app(ContentBlockGenerationService::class);
    $response = $service->generateBlockContent($block, $project);

    $block->refresh();
    $topic->refresh();

    expect($response->valid)->toBeTrue();
    expect($block->generation_status)->toBe(BlockGenerationStatus::Generated);
    expect($block->content['type'])->toBe('doc');
    expect($block->summary_sentence)->toBe('Speed is distance over time.');
    expect($block->key_terms_introduced[0]['term'])->toBe('speed');
    expect($block->last_generation_log_id)->toBe($log->id);
    expect($topic->glossary['terms'][0]['term'])->toBe('speed');
    expect($topic->glossary['symbols'][0]['symbol'])->toBe('v');
});

it('regeneration with changed contract flags downstream blocks', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->generated()
        ->create([
            'title' => 'First',
            'content_guidance' => 'g1',
            'key_terms_introduced' => [['term' => 'speed', 'definition' => 'A']],
            'symbols_used' => [],
            'summary_sentence' => 'Prior',
        ]);

    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')
        ->generated()
        ->create(['title' => 'Downstream']);

    $topic->update(['glossary' => [
        'terms' => [['term' => 'speed', 'definition' => 'A', 'first_block_id' => $b1->id]],
        'symbols' => [],
    ]]);

    $log = AIGenerationLog::factory()->create();
    $gen = m::mock(ContentGenerationService::class);
    $changed = new ContentResponse(
        valid: true,
        data: array_merge(happyAIResponse($log->id)->data, [
            'key_terms_introduced' => [['term' => 'speed', 'definition' => 'B']],
            'summary_sentence' => 'New summary',
        ]),
        validation_errors: [],
        raw_response: '...',
        model_used: 'deepseek-chat',
        tokens_used: 1000,
        generation_time_ms: 4000.0,
        input_tokens: 600,
        output_tokens: 400,
        generation_log_id: $log->id,
    );
    $gen->shouldReceive('generate')->andReturn($changed);
    app()->instance(ContentGenerationService::class, $gen);

    app(ContentBlockGenerationService::class)->generateBlockContent($b1->fresh(), $project);

    expect($b2->fresh()->drift_advisory)->not->toBeNull()
        ->and($b2->fresh()->drift_advisory['source_block_id'])->toBe($b1->id);
});

it('throws DomainException when AI returns content with disallowed Tiptap nodes', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->withGuidance('x')->notStarted()->create();

    $fakeLogId = (string) \Illuminate\Support\Str::uuid();
    $gen = m::mock(ContentGenerationService::class);
    $gen->shouldReceive('generate')->andReturn(new ContentResponse(
        valid: true,
        data: array_merge(happyAIResponse($fakeLogId)->data, [
            'content' => ['type' => 'doc', 'content' => [['type' => 'script', 'content' => []]]],
        ]),
        validation_errors: [],
        raw_response: '...',
        model_used: 'test',
        tokens_used: 100,
        generation_time_ms: 100.0,
        input_tokens: 50,
        output_tokens: 50,
        generation_log_id: $fakeLogId,
    ));
    app()->instance(ContentGenerationService::class, $gen);

    app(ContentBlockGenerationService::class)->generateBlockContent($block, $project);
})->throws(\DomainException::class, 'disallowed');

it('throws DomainException when attempting to regenerate an already approved block', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->withGuidance('x')->approved()->create();

    $gen = m::mock(ContentGenerationService::class);
    app()->instance(ContentGenerationService::class, $gen);

    app(ContentBlockGenerationService::class)->generateBlockContent($block, $project);
})->throws(\DomainException::class, 'approved');

it('invalid AI response throws DomainException and does not alter block or glossary', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->withGuidance('x')->notStarted()->create();

    $gen = m::mock(ContentGenerationService::class);
    $gen->shouldReceive('generate')->andReturn(new ContentResponse(
        valid: false,
        data: [],
        validation_errors: ['content' => ['required']],
        raw_response: '{}',
        model_used: 'x',
        tokens_used: 0,
        generation_time_ms: 100.0,
        input_tokens: 0,
        output_tokens: 0,
        generation_log_id: null,
    ));
    app()->instance(ContentGenerationService::class, $gen);

    app(ContentBlockGenerationService::class)->generateBlockContent($block, $project);
})->throws(\DomainException::class);
