<?php

use App\Models\AIModel;
use App\Models\ContentProject;

uses(Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

it('accepts and reads content_model_id', function () {
    $model = AIModel::factory()->create();
    $project = ContentProject::factory()->create(['content_model_id' => $model->id]);

    expect($project->fresh()->content_model_id)->toBe($model->id);
});

it('exposes contentModel relationship', function () {
    $model = AIModel::factory()->create();
    $project = ContentProject::factory()->create(['content_model_id' => $model->id]);

    expect($project->contentModel)->toBeInstanceOf(AIModel::class)
        ->and($project->contentModel->id)->toBe($model->id);
});
