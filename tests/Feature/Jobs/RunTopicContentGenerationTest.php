<?php

use App\DataTransferObjects\ContentResponse;
use App\ContentStudio\Support\TopicGenerationLock;
use App\Enums\BlockGenerationStatus;
use App\Events\ContentGenerationUpdate;
use App\Jobs\RunTopicContentGeneration;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentBlockGenerationService;
use Illuminate\Support\Facades\Event;
use Mockery as m;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function fakeResponse(string $title): ContentResponse
{
    return new ContentResponse(
        valid: true,
        data: [
            'block_title' => $title,
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $title]]]]],
            'summary_sentence' => "Summary of {$title}.",
            'key_terms_introduced' => [],
            'symbols_used' => [],
            'formulas_used' => [],
            'word_count' => 100,
            'nigerian_context_used' => true,
        ],
        validation_errors: [],
        raw_response: '',
        model_used: 'm',
        tokens_used: 0,
        generation_time_ms: 1.0,
        input_tokens: 0,
        output_tokens: 0,
        generation_log_id: "log-{$title}",
    );
}

it('iterates blocks in path order and skips non-not_started when only_unstarted', function () {
    Event::fake([ContentGenerationUpdate::class]);

    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->approved()->withGuidance('g1')->create(['title' => 'One']);
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')
        ->notStarted()->withGuidance('g2')->create(['title' => 'Two']);
    $b3 = ContentBlock::factory()->leaf()->at('1.3')->for($topic, 'canonicalTopic')
        ->notStarted()->withGuidance('g3')->create(['title' => 'Three']);

    $service = m::mock(ContentBlockGenerationService::class);
    $service->shouldReceive('generateBlockContent')->with(m::on(fn ($b) => $b->id === $b2->id), m::any(), m::any())->once()->andReturn(fakeResponse('Two'));
    $service->shouldReceive('generateBlockContent')->with(m::on(fn ($b) => $b->id === $b3->id), m::any(), m::any())->once()->andReturn(fakeResponse('Three'));
    app()->instance(ContentBlockGenerationService::class, $service);

    (new RunTopicContentGeneration($project, $topic, 'job-1', null, true))->handle(app());
});

it('continues on per-block failure and logs to ai_context', function () {
    Event::fake([ContentGenerationUpdate::class]);

    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $b1 = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')->notStarted()->withGuidance('g')->create();
    $b2 = ContentBlock::factory()->leaf()->at('1.2')->for($topic, 'canonicalTopic')->notStarted()->withGuidance('g')->create();

    $service = m::mock(ContentBlockGenerationService::class);
    $service->shouldReceive('generateBlockContent')->with(m::on(fn ($b) => $b->id === $b1->id), m::any(), m::any())->andThrow(new \DomainException('boom'));
    $service->shouldReceive('generateBlockContent')->with(m::on(fn ($b) => $b->id === $b2->id), m::any(), m::any())->andReturn(fakeResponse('Two'));
    app()->instance(ContentBlockGenerationService::class, $service);

    (new RunTopicContentGeneration($project, $topic, 'job-2', null, true))->handle(app());

    expect($project->fresh()->ai_context['content_failed'][$b1->id]['reason'])->toBe('validation_exhausted');
});

it('releases the topic lock after completion', function () {
    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    $service = m::mock(ContentBlockGenerationService::class);
    app()->instance(ContentBlockGenerationService::class, $service);

    (new RunTopicContentGeneration($project, $topic, 'job-3', null, true))->handle(app());

    expect(TopicGenerationLock::isHeld($topic->id))->toBeFalse();
});
