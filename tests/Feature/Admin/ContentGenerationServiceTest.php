<?php

use App\ContentStudio\ContentAIProvider;
use App\ContentStudio\Prompts\ContentPromptTemplate;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Models\ContentProject;
use App\Services\ContentGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['content-studio.ai_provider' => 'anthropic']);
    config(['content-studio.retry.max_attempts' => 2]);
    config(['content-studio.retry.validation_correction' => true]);
});

it('logs generation to ai_generation_logs', function () {
    $project = ContentProject::factory()->create();

    $mockProvider = Mockery::mock(ContentAIProvider::class);
    $mockProvider->shouldReceive('generate')
        ->once()
        ->andReturn(new ContentResponse(
            valid: true,
            data: ['test' => 'value'],
            raw_response: '{"test":"value"}',
            model_used: 'test-model',
            tokens_used: 100,
            generation_time_ms: 500,
        ));

    $template = new class extends ContentPromptTemplate {
        public function promptType(): string
        {
            return 'P-TEST';
        }

        public function systemPrompt(): string
        {
            return 'You are a test.';
        }

        public function userPrompt(array $context): string
        {
            return 'Generate test content.';
        }

        public function jsonSchema(): array
        {
            return [];
        }
    };

    $service = new ContentGenerationService();

    $this->mock(ContentAIProvider::class, fn () => $mockProvider);

    app()->bind(ContentAIProvider::class, fn () => $mockProvider);

    $prompt = $template->build([]);
    $response = $mockProvider->generate($prompt);

    expect($response->valid)->toBeTrue();
    expect($response->data)->toBe(['test' => 'value']);
    expect($response->model_used)->toBe('test-model');
    expect($response->tokens_used)->toBe(100);
});

it('creates a valid ContentPrompt from template', function () {
    $template = new class extends ContentPromptTemplate {
        public function promptType(): string
        {
            return 'P-01';
        }

        public function systemPrompt(): string
        {
            return 'System prompt here.';
        }

        public function userPrompt(array $context): string
        {
            return "Parse curriculum for {$context['subject']}.";
        }

        public function jsonSchema(): array
        {
            return ['subject' => ['required', 'string']];
        }

        public function temperature(): float
        {
            return 0.3;
        }
    };

    $prompt = $template->build(['subject' => 'Physics']);

    expect($prompt)
        ->toBeInstanceOf(ContentPrompt::class)
        ->system_prompt->toBe('System prompt here.')
        ->user_prompt->toBe('Parse curriculum for Physics.')
        ->temperature->toBe(0.3)
        ->expected_format->toBe('json')
        ->context->toBe(['subject' => 'Physics']);
});

it('creates a valid ContentResponse', function () {
    $response = new ContentResponse(
        valid: true,
        data: ['topics' => []],
        raw_response: '{"topics":[]}',
        model_used: 'claude-sonnet-4-20250514',
        tokens_used: 250,
        generation_time_ms: 1200.5,
    );

    expect($response)
        ->valid->toBeTrue()
        ->data->toBe(['topics' => []])
        ->model_used->toBe('claude-sonnet-4-20250514')
        ->tokens_used->toBe(250)
        ->generation_time_ms->toBe(1200.5)
        ->validation_errors->toBe([]);
});

it('creates an invalid ContentResponse with errors', function () {
    $response = new ContentResponse(
        valid: false,
        data: [],
        validation_errors: ['json_parse_error' => 'Syntax error'],
        raw_response: 'not json',
        model_used: 'gpt-4o',
        tokens_used: 50,
        generation_time_ms: 300,
    );

    expect($response)
        ->valid->toBeFalse()
        ->validation_errors->toHaveKey('json_parse_error')
        ->raw_response->toBe('not json');
});
