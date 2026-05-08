<?php

use App\Enums\AnswerDepthLevel;
use App\Jobs\RunAnswerGeneration;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\User;
use App\Services\Admin\AnswerGenerationService;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->student = User::factory()->create();
    $this->course = InstitutionCourse::factory()->create();
    $this->question = Question::factory()->for($this->course)->create(['created_by' => $this->admin->id]);
});

// ── plan endpoint ──────────────────────────────────────────────────────────────

test('plan returns generation plan from service', function () {
    $plan = [
        'prose_outline' => ['Introduce the concept.', 'Explain the mechanism.'],
        'illustration_briefs' => [],
        'estimated_tokens' => 600,
        'estimated_seconds' => 4,
    ];

    $this->mock(AnswerGenerationService::class, function ($mock) use ($plan) {
        $mock->shouldReceive('plan')
            ->once()
            ->with(
                \Mockery::on(fn ($q) => $q->id === test()->question->id),
                AnswerDepthLevel::Quick,
            )
            ->andReturn($plan);
    });

    $this->actingAs($this->admin)
        ->postJson(route('admin.questions.answers.plan', [$this->question, 'quick']))
        ->assertOk()
        ->assertJson($plan);
});

test('plan returns 422 for invalid depth value', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.questions.answers.plan', [$this->question, 'invalid_depth']))
        ->assertUnprocessable()
        ->assertJsonFragment(['message' => 'Invalid depth: invalid_depth']);
});

test('plan returns 422 when service throws DomainException', function () {
    $this->mock(AnswerGenerationService::class, function ($mock) {
        $mock->shouldReceive('plan')
            ->once()
            ->andThrow(new \DomainException('Answer plan generation failed: ["bad json"]'));
    });

    $this->actingAs($this->admin)
        ->postJson(route('admin.questions.answers.plan', [$this->question, 'quick']))
        ->assertUnprocessable()
        ->assertJsonFragment(['message' => 'Answer plan generation failed: ["bad json"]']);
});

test('plan rejects students with 403', function () {
    $this->actingAs($this->student)
        ->postJson(route('admin.questions.answers.plan', [$this->question, 'quick']))
        ->assertForbidden();
});

test('plan rejects unauthenticated requests', function () {
    $this->postJson(route('admin.questions.answers.plan', [$this->question, 'quick']))
        ->assertUnauthorized();
});

// ── generate endpoint ──────────────────────────────────────────────────────────

test('generate dispatches RunAnswerGeneration job and returns job_id', function () {
    Queue::fake();

    $response = $this->actingAs($this->admin)
        ->postJson(route('admin.questions.answers.generate', [$this->question, 'standard']))
        ->assertOk()
        ->assertJsonStructure(['job_id']);

    Queue::assertPushed(RunAnswerGeneration::class, function ($job) {
        return $job->question->id === test()->question->id
            && $job->depth === AnswerDepthLevel::Standard;
    });

    expect($response->json('job_id'))->toBeString()->toHaveLength(36);
});

test('generate dispatches for all valid depths', function () {
    Queue::fake();

    foreach (['quick', 'standard', 'deep_dive'] as $depth) {
        $this->actingAs($this->admin)
            ->postJson(route('admin.questions.answers.generate', [$this->question, $depth]))
            ->assertOk();
    }

    Queue::assertPushed(RunAnswerGeneration::class, 3);
});

test('generate returns 422 for invalid depth', function () {
    Queue::fake();

    $this->actingAs($this->admin)
        ->postJson(route('admin.questions.answers.generate', [$this->question, 'mega_deep']))
        ->assertUnprocessable()
        ->assertJsonFragment(['message' => 'Invalid depth: mega_deep']);

    Queue::assertNothingPushed();
});

test('generate rejects students with 403', function () {
    Queue::fake();

    $this->actingAs($this->student)
        ->postJson(route('admin.questions.answers.generate', [$this->question, 'quick']))
        ->assertForbidden();

    Queue::assertNothingPushed();
});

test('generate rejects unauthenticated requests', function () {
    Queue::fake();

    $this->postJson(route('admin.questions.answers.generate', [$this->question, 'quick']))
        ->assertUnauthorized();

    Queue::assertNothingPushed();
});
