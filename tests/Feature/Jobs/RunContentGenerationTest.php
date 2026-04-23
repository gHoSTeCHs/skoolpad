<?php

use App\DataTransferObjects\ContentResponse;
use App\Enums\ContentProjectMode;
use App\Enums\ContentProjectStatus;
use App\Events\ContentGenerationUpdate;
use App\Jobs\RunContentGeneration;
use App\Models\AIModel;
use App\Models\ContentProject;
use App\Models\User;
use App\Services\ContentProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

function createProjectWithResearch(): ContentProject
{
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create([
        'mode' => ContentProjectMode::Secondary,
        'status' => ContentProjectStatus::Research,
        'created_by' => $user->id,
        'ai_context' => [
            'research' => ['total_topics_found' => 3, 'terms' => []],
            'research_approved' => [
                ['title' => 'Topic 1', 'term_number' => 1, 'sequence' => 1, 'sub_topics' => []],
            ],
        ],
    ]);
    AIModel::factory()->create(['is_active' => true]);

    return $project;
}

it('broadcasts status and complete events on success', function () {
    Event::fake([ContentGenerationUpdate::class]);
    $project = createProjectWithResearch();
    $jobId = 'test-job-'.fake()->uuid();

    $mockResponse = new ContentResponse(
        valid: true,
        data: ['total_topics_found' => 3, 'terms' => []],
        raw_response: '{"total_topics_found": 3}',
        model_used: 'deepseek-chat',
        tokens_used: 100,
        input_tokens: 60,
        output_tokens: 40,
        generation_log_id: fake()->uuid(),
    );

    $mockService = Mockery::mock(ContentProjectService::class);
    $mockService->shouldReceive('runCurriculumResearch')
        ->once()
        ->andReturn($mockResponse);

    app()->instance(ContentProjectService::class, $mockService);

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        $jobId,
    );

    $job->handle(app(ContentProjectService::class));

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn ($event) => $event->projectId === $project->id
            && $event->jobId === $jobId
            && $event->type === 'status'
            && $event->data['state'] === 'processing',
    );

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn ($event) => $event->projectId === $project->id
            && $event->jobId === $jobId
            && $event->type === 'complete'
            && $event->data['stage'] === 'research'
            && array_key_exists('generation_log_id', $event->data),
    );
});

it('broadcasts error event when generation fails', function () {
    Event::fake([ContentGenerationUpdate::class]);
    $project = createProjectWithResearch();
    $jobId = 'test-job-'.fake()->uuid();

    $mockResponse = new ContentResponse(
        valid: false,
        data: [],
        validation_errors: ['api_error' => 'Rate limit exceeded'],
        raw_response: '',
        model_used: 'deepseek-chat',
    );

    $mockService = Mockery::mock(ContentProjectService::class);
    $mockService->shouldReceive('runCurriculumResearch')
        ->once()
        ->andReturn($mockResponse);

    app()->instance(ContentProjectService::class, $mockService);

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        $jobId,
    );

    $job->handle(app(ContentProjectService::class));

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn ($event) => $event->type === 'error'
            && str_contains($event->data['message'], 'Rate limit exceeded'),
    );
});

it('broadcasts error event on DomainException', function () {
    Event::fake([ContentGenerationUpdate::class]);
    $project = createProjectWithResearch();
    $jobId = 'test-job-'.fake()->uuid();

    $mockService = Mockery::mock(ContentProjectService::class);
    $mockService->shouldReceive('runCurriculumResearch')
        ->once()
        ->andThrow(new \DomainException('Research must be approved first.'));

    app()->instance(ContentProjectService::class, $mockService);

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        $jobId,
    );

    $job->handle(app(ContentProjectService::class));

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn ($event) => $event->type === 'error'
            && $event->data['message'] === 'Research must be approved first.',
    );
});

it('broadcasts error event when job fails via failed method', function () {
    Event::fake([ContentGenerationUpdate::class]);
    $project = createProjectWithResearch();
    $jobId = 'test-job-'.fake()->uuid();

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        $jobId,
    );

    $job->failed(new \RuntimeException('Connection timed out'));

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn ($event) => $event->type === 'error'
            && str_contains($event->data['message'], 'Connection timed out'),
    );
});

it('formats connection error message correctly', function () {
    Event::fake([ContentGenerationUpdate::class]);
    $project = createProjectWithResearch();
    $jobId = 'test-job-'.fake()->uuid();

    $mockResponse = new ContentResponse(
        valid: false,
        data: [],
        validation_errors: ['connection_error' => 'timeout'],
        raw_response: '',
        model_used: 'deepseek-chat',
    );

    $mockService = Mockery::mock(ContentProjectService::class);
    $mockService->shouldReceive('runCurriculumResearch')
        ->once()
        ->andReturn($mockResponse);

    app()->instance(ContentProjectService::class, $mockService);

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        $jobId,
    );

    $job->handle(app(ContentProjectService::class));

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn ($event) => $event->type === 'error'
            && $event->data['message'] === 'Could not reach AI provider. Check network or switch models.',
    );
});

it('formats json parse error with stage label', function () {
    Event::fake([ContentGenerationUpdate::class]);
    $project = createProjectWithResearch();
    $jobId = 'test-job-'.fake()->uuid();

    $mockResponse = new ContentResponse(
        valid: false,
        data: [],
        validation_errors: ['json_parse_error' => 'Unexpected token'],
        raw_response: 'not json',
        model_used: 'deepseek-chat',
    );

    $mockService = Mockery::mock(ContentProjectService::class);
    $mockService->shouldReceive('runCurriculumResearch')
        ->once()
        ->andReturn($mockResponse);

    app()->instance(ContentProjectService::class, $mockService);

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        $jobId,
    );

    $job->handle(app(ContentProjectService::class));

    Event::assertDispatched(
        ContentGenerationUpdate::class,
        fn ($event) => $event->type === 'error'
            && str_contains($event->data['message'], 'malformed JSON for research'),
    );
});

it('uses the default queue', function () {
    $project = createProjectWithResearch();

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        'test-job-id',
    );

    expect($job->queue)->toBeNull();
});
