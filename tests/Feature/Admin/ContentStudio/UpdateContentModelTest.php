<?php

use App\Models\AIModel;
use App\Models\ContentProject;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('accepts content_model_id on project model update', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);
    $model = AIModel::factory()->create();

    $this->actingAs($user)
        ->putJson(route('admin.content-studio.update-models', $project), [
            'content_model_id' => $model->id,
        ])
        ->assertOk();

    expect($project->fresh()->content_model_id)->toBe($model->id);
});

it('rejects non-existent content_model_id', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->putJson(route('admin.content-studio.update-models', $project), [
            'content_model_id' => '00000000-0000-0000-0000-000000000000',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['content_model_id']);
});
