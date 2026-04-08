<?php

use App\Enums\AIAdapterType;
use App\Enums\UserRole;
use App\Models\AIModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lists AI models for authorized staff', function () {
    $user = User::factory()->admin()->create();
    AIModel::factory()->count(3)->create();

    $response = $this->actingAs($user)
        ->get(route('admin.ai-models.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ai-models/index')
            ->has('models.data', 3)
        );
});

it('searches models by name', function () {
    $user = User::factory()->admin()->create();
    AIModel::factory()->create(['name' => 'DeepSeek V3']);
    AIModel::factory()->create(['name' => 'Claude Sonnet']);

    $response = $this->actingAs($user)
        ->get(route('admin.ai-models.index', ['search' => 'Deep']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('models.data', 1)
        );
});

it('shows the create form', function () {
    $user = User::factory()->admin()->create();

    $response = $this->actingAs($user)
        ->get(route('admin.ai-models.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ai-models/create')
            ->has('adapterTypes')
        );
});

it('creates an AI model with valid data', function () {
    $user = User::factory()->admin()->create();

    $response = $this->actingAs($user)
        ->post(route('admin.ai-models.store'), [
            'name' => 'Test Model',
            'slug' => 'test-model',
            'adapter_type' => 'openai_compatible',
            'base_url' => 'https://api.example.com/v1',
            'api_key' => 'sk-test-key',
            'model_id' => 'test-chat',
            'max_tokens' => 4096,
            'input_cost_per_million' => 50,
            'output_cost_per_million' => 200,
            'is_active' => true,
            'sort_order' => 0,
        ]);

    $response->assertRedirect(route('admin.ai-models.index'));

    $this->assertDatabaseHas('ai_models', [
        'name' => 'Test Model',
        'slug' => 'test-model',
        'adapter_type' => 'openai_compatible',
        'model_id' => 'test-chat',
    ]);
});

it('auto-generates slug when not provided', function () {
    $user = User::factory()->admin()->create();

    $this->actingAs($user)
        ->post(route('admin.ai-models.store'), [
            'name' => 'My Custom Model',
            'adapter_type' => 'anthropic',
            'base_url' => 'https://api.anthropic.com/v1',
            'model_id' => 'custom-model',
            'max_tokens' => 8192,
            'input_cost_per_million' => 100,
            'output_cost_per_million' => 500,
        ]);

    $this->assertDatabaseHas('ai_models', [
        'slug' => 'my-custom-model',
    ]);
});

it('rejects invalid adapter type', function () {
    $user = User::factory()->admin()->create();

    $response = $this->actingAs($user)
        ->postJson(route('admin.ai-models.store'), [
            'name' => 'Bad Model',
            'adapter_type' => 'invalid_adapter',
            'base_url' => 'https://example.com',
            'model_id' => 'test',
            'max_tokens' => 8192,
            'input_cost_per_million' => 0,
            'output_cost_per_million' => 0,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['adapter_type']);
});

it('rejects duplicate slugs', function () {
    $user = User::factory()->admin()->create();
    AIModel::factory()->create(['slug' => 'existing-model']);

    $response = $this->actingAs($user)
        ->postJson(route('admin.ai-models.store'), [
            'name' => 'New Model',
            'slug' => 'existing-model',
            'adapter_type' => 'openai_compatible',
            'base_url' => 'https://example.com/v1',
            'model_id' => 'test',
            'max_tokens' => 8192,
            'input_cost_per_million' => 0,
            'output_cost_per_million' => 0,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['slug']);
});

it('shows the edit form with masked API key', function () {
    $user = User::factory()->admin()->create();
    $model = AIModel::factory()->create(['api_key' => 'real-secret-key']);

    $response = $this->actingAs($user)
        ->get(route('admin.ai-models.edit', $model));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ai-models/edit')
            ->where('aiModel.api_key', '••••••••')
        );
});

it('updates a model without overwriting API key when placeholder submitted', function () {
    $user = User::factory()->admin()->create();
    $model = AIModel::factory()->create(['name' => 'Old Name', 'api_key' => 'real-key']);

    $this->actingAs($user)
        ->put(route('admin.ai-models.update', $model), [
            'name' => 'New Name',
            'slug' => $model->slug,
            'adapter_type' => $model->adapter_type->value,
            'base_url' => $model->base_url,
            'api_key' => '••••••••',
            'model_id' => $model->model_id,
            'max_tokens' => $model->max_tokens,
            'input_cost_per_million' => $model->input_cost_per_million,
            'output_cost_per_million' => $model->output_cost_per_million,
        ]);

    $model->refresh();
    expect($model->name)->toBe('New Name');
    expect($model->api_key)->toBe('real-key');
});

it('clears API key when empty string submitted', function () {
    $user = User::factory()->admin()->create();
    $model = AIModel::factory()->create(['api_key' => 'real-key']);

    $this->actingAs($user)
        ->put(route('admin.ai-models.update', $model), [
            'name' => $model->name,
            'slug' => $model->slug,
            'adapter_type' => $model->adapter_type->value,
            'base_url' => $model->base_url,
            'api_key' => '',
            'model_id' => $model->model_id,
            'max_tokens' => $model->max_tokens,
            'input_cost_per_million' => $model->input_cost_per_million,
            'output_cost_per_million' => $model->output_cost_per_million,
        ]);

    $model->refresh();
    expect($model->api_key)->toBeNull();
});

it('deletes a model', function () {
    $user = User::factory()->admin()->create();
    $model = AIModel::factory()->create();

    $response = $this->actingAs($user)
        ->delete(route('admin.ai-models.destroy', $model));

    $response->assertRedirect(route('admin.ai-models.index'));
    $this->assertDatabaseMissing('ai_models', ['id' => $model->id]);
});

it('prevents students from accessing AI models', function () {
    $student = User::factory()->create(['role' => UserRole::Student]);

    $response = $this->actingAs($student)
        ->get(route('admin.ai-models.index'));

    $response->assertForbidden();
});

it('prevents unauthenticated access', function () {
    $response = $this->get(route('admin.ai-models.index'));

    $response->assertRedirect(route('login'));
});
