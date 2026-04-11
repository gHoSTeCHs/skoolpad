<?php

use App\DataTransferObjects\ContentResponse;
use App\Enums\ContentProjectMode;
use App\Enums\ContentProjectStatus;
use App\Jobs\RunContentGeneration;
use App\Models\AIModel;
use App\Models\ContentProject;
use App\Models\User;
use App\Services\ContentProjectService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

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

it('writes status and complete events to cache on success', function () {
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

    $events = Cache::get("cs_job:{$project->id}:{$jobId}");
    expect($events)->toBeArray()
        ->and($events)->toHaveCount(2);

    expect($events[0]['type'])->toBe('status');
    expect($events[0]['data']['state'])->toBe('processing');

    expect($events[1]['type'])->toBe('complete');
    expect($events[1]['data'])->toHaveKeys(['stage', 'project', 'log_entry']);
});

it('writes error event when generation fails', function () {
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

    $events = Cache::get("cs_job:{$project->id}:{$jobId}");
    $lastEvent = end($events);
    expect($lastEvent['type'])->toBe('error');
    expect($lastEvent['data']['message'])->toContain('Rate limit exceeded');
});

it('writes error event on DomainException', function () {
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

    $events = Cache::get("cs_job:{$project->id}:{$jobId}");
    $lastEvent = end($events);
    expect($lastEvent['type'])->toBe('error');
    expect($lastEvent['data']['message'])->toBe('Research must be approved first.');
});

it('writes error event when job fails via failed method', function () {
    $project = createProjectWithResearch();
    $jobId = 'test-job-'.fake()->uuid();

    $job = new RunContentGeneration(
        $project,
        'research',
        ['document_text' => 'Test curriculum'],
        $jobId,
    );

    $job->failed(new \RuntimeException('Connection timed out'));

    $events = Cache::get("cs_job:{$project->id}:{$jobId}");
    expect($events)->toHaveCount(1);
    expect($events[0]['type'])->toBe('error');
    expect($events[0]['data']['message'])->toContain('Connection timed out');
});

it('formats connection error message correctly', function () {
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

    $events = Cache::get("cs_job:{$project->id}:{$jobId}");
    $lastEvent = end($events);
    expect($lastEvent['data']['message'])->toBe('Could not reach AI provider. Check network or switch models.');
});

it('formats json parse error with stage label', function () {
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

    $events = Cache::get("cs_job:{$project->id}:{$jobId}");
    $lastEvent = end($events);
    expect($lastEvent['data']['message'])->toContain('malformed JSON for research');
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
