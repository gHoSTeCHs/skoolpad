<?php

use App\ContentStudio\Adapters\AnthropicAdapter;
use App\ContentStudio\Adapters\OpenAICompatibleAdapter;
use App\ContentStudio\Prompts\ContentPromptTemplate;
use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;
use App\Enums\AIAdapterType;
use App\Models\AIModel;
use App\Models\PlatformSetting;
use App\Services\ContentGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('resolves the correct adapter for openai_compatible models', function () {
    $model = AIModel::factory()->create(['adapter_type' => AIAdapterType::OpenAICompatible]);
    $service = new ContentGenerationService();

    $adapter = $service->resolveAdapter($model);

    expect($adapter)->toBeInstanceOf(OpenAICompatibleAdapter::class);
});

it('resolves the correct adapter for anthropic models', function () {
    $model = AIModel::factory()->anthropic()->create();
    $service = new ContentGenerationService();

    $adapter = $service->resolveAdapter($model);

    expect($adapter)->toBeInstanceOf(AnthropicAdapter::class);
});

it('resolves model by explicit ID', function () {
    $model = AIModel::factory()->create(['name' => 'Target Model']);
    AIModel::factory()->create(['name' => 'Other Model']);

    $service = new ContentGenerationService();
    $resolved = $service->resolveModel($model->id);

    expect($resolved->id)->toBe($model->id);
});

it('resolves model by task routing', function () {
    $model = AIModel::factory()->create(['name' => 'Routed Model']);

    PlatformSetting::query()->create([
        'key' => 'ai_task_routing',
        'value' => ['structure' => $model->id, 'content' => $model->id],
    ]);

    $service = new ContentGenerationService();
    $resolved = $service->resolveModel(null, 'structure');

    expect($resolved->id)->toBe($model->id);
});

it('falls back to first active model when no routing exists', function () {
    $first = AIModel::factory()->create(['sort_order' => 1, 'name' => 'First']);
    AIModel::factory()->create(['sort_order' => 2, 'name' => 'Second']);

    $service = new ContentGenerationService();
    $resolved = $service->resolveModel();

    expect($resolved->id)->toBe($first->id);
});

it('skips inactive models in fallback', function () {
    AIModel::factory()->inactive()->create(['sort_order' => 1, 'name' => 'Inactive']);
    $active = AIModel::factory()->create(['sort_order' => 2, 'name' => 'Active']);

    $service = new ContentGenerationService();
    $resolved = $service->resolveModel();

    expect($resolved->id)->toBe($active->id);
});

it('throws when no active models exist', function () {
    $service = new ContentGenerationService();

    expect(fn () => $service->resolveModel())
        ->toThrow(RuntimeException::class, 'No active AI models configured');
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

it('creates a ContentResponse with split token counts', function () {
    $response = new ContentResponse(
        valid: true,
        data: ['topics' => []],
        raw_response: '{"topics":[]}',
        model_used: 'deepseek-chat',
        tokens_used: 350,
        generation_time_ms: 1200.5,
        input_tokens: 200,
        output_tokens: 150,
    );

    expect($response)
        ->valid->toBeTrue()
        ->tokens_used->toBe(350)
        ->input_tokens->toBe(200)
        ->output_tokens->toBe(150);
});

it('defaults split tokens to zero for backward compatibility', function () {
    $response = new ContentResponse(
        valid: true,
        data: [],
        raw_response: '',
        model_used: 'test',
        tokens_used: 100,
    );

    expect($response)
        ->input_tokens->toBe(0)
        ->output_tokens->toBe(0);
});
