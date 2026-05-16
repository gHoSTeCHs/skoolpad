<?php

use App\DataTransferObjects\ContentResponse;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentBlockGenerationService;
use App\Services\ContentGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery as m;

uses(RefreshDatabase::class);

function hcg_hollowResponse(int $wordCount = 642): ContentResponse
{
    return new ContentResponse(
        valid: true,
        data: [
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph']]],
            'summary_sentence' => 'This block defines key physics terms.',
            'key_terms_introduced' => [],
            'symbols_used' => [],
            'formulas_used' => [],
            'word_count' => $wordCount,
            'nigerian_context_used' => false,
        ],
        generation_log_id: 'log-hollow',
    );
}

function hcg_realContentResponse(): ContentResponse
{
    $text = str_repeat('The quick brown fox jumps over the lazy dog. ', 30);

    return new ContentResponse(
        valid: true,
        data: [
            'content' => [
                'type' => 'doc',
                'content' => [
                    ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
                ],
            ],
            'summary_sentence' => 'A block with real content.',
            'key_terms_introduced' => [],
            'symbols_used' => [],
            'formulas_used' => [],
            'word_count' => 60,
            'nigerian_context_used' => false,
        ],
        generation_log_id: 'log-real',
    );
}

function hcg_blockWithGuidance(): ContentBlock
{
    $topic = CanonicalTopic::factory()->create();

    return ContentBlock::factory()
        ->leaf()
        ->at('1.1')
        ->for($topic, 'canonicalTopic')
        ->withGuidance('Explain key physics terms in detail.')
        ->notStarted()
        ->create();
}

function hcg_makeService(ContentResponse $response): ContentBlockGenerationService
{
    $generation = m::mock(ContentGenerationService::class);
    $generation->shouldReceive('generate')->andReturn($response);

    return new ContentBlockGenerationService($generation);
}

it('throws when ai returns an empty paragraph body but claims a non-zero word count', function () {
    $block = hcg_blockWithGuidance();
    $project = ContentProject::factory()->create();
    $service = hcg_makeService(hcg_hollowResponse(wordCount: 642));

    expect(fn () => $service->generateBlockContent($block, $project))
        ->toThrow(\DomainException::class);
});

it('does not throw when ai returns actual text content', function () {
    $block = hcg_blockWithGuidance();
    $project = ContentProject::factory()->create();
    $service = hcg_makeService(hcg_realContentResponse());

    expect(fn () => $service->generateBlockContent($block, $project))
        ->not->toThrow(\DomainException::class);
});

it('does not throw when claimed word count is zero even with a hollow body', function () {
    $block = hcg_blockWithGuidance();
    $project = ContentProject::factory()->create();
    $service = hcg_makeService(hcg_hollowResponse(wordCount: 0));

    expect(fn () => $service->generateBlockContent($block, $project))
        ->not->toThrow(\DomainException::class);
});
