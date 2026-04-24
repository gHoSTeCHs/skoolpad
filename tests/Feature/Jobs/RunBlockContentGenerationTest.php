<?php

use App\Events\ContentGenerationUpdate;
use App\Jobs\RunBlockContentGeneration;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Services\ContentBlockGenerationService;
use Illuminate\Support\Facades\Event;
use Mockery as m;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('calls the service and broadcasts complete on success', function () {
    Event::fake([ContentGenerationUpdate::class]);

    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->withGuidance('g')->notStarted()->create();

    $service = m::mock(ContentBlockGenerationService::class);
    $response = new \App\DataTransferObjects\ContentResponse(
        valid: true,
        data: ['block_title' => 'x'],
        validation_errors: [],
        raw_response: '',
        model_used: 'm',
        tokens_used: 0,
        generation_time_ms: 1.0,
        input_tokens: 0,
        output_tokens: 0,
        generation_log_id: 'log-1',
    );
    $service->shouldReceive('generateBlockContent')->andReturn($response);
    app()->instance(ContentBlockGenerationService::class, $service);

    (new RunBlockContentGeneration($project, $block, 'job-1', null))->handle(app());

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn (ContentGenerationUpdate $e) => $e->type === 'complete'
            && $e->data['stage'] === 'content'
            && $e->data['generation_log_id'] === 'log-1',
    );
});

it('broadcasts error on DomainException', function () {
    Event::fake([ContentGenerationUpdate::class]);

    $project = ContentProject::factory()->create();
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->leaf()->at('1.1')->for($topic, 'canonicalTopic')
        ->withGuidance('g')->notStarted()->create();

    $service = m::mock(ContentBlockGenerationService::class);
    $service->shouldReceive('generateBlockContent')->andThrow(new \DomainException('AI returned invalid response'));
    app()->instance(ContentBlockGenerationService::class, $service);

    (new RunBlockContentGeneration($project, $block, 'job-2', null))->handle(app());

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn (ContentGenerationUpdate $e) => $e->type === 'error',
    );
});
