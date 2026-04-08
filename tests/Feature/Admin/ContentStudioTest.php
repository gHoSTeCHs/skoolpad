<?php

use App\Enums\ContentProjectMode;
use App\Enums\ContentProjectStatus;
use App\Enums\UserRole;
use App\Models\ContentProject;
use App\Models\CurriculumSubject;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lists content projects for authorized staff', function () {
    $user = User::factory()->admin()->create();
    ContentProject::factory()->count(3)->create(['created_by' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('admin.content-studio.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/content-studio/index')
            ->has('projects.data', 3)
        );
});

it('filters projects by mode', function () {
    $user = User::factory()->admin()->create();
    ContentProject::factory()->secondary()->create(['created_by' => $user->id]);
    ContentProject::factory()->secondary()->create(['created_by' => $user->id]);
    ContentProject::factory()->tertiary()->create(['created_by' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('admin.content-studio.index', ['mode' => 'secondary']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('projects.data', 2)
        );
});

it('filters projects by status', function () {
    $user = User::factory()->admin()->create();
    ContentProject::factory()->create(['created_by' => $user->id, 'status' => ContentProjectStatus::Draft]);
    ContentProject::factory()->create(['created_by' => $user->id, 'status' => ContentProjectStatus::Research]);

    $response = $this->actingAs($user)
        ->get(route('admin.content-studio.index', ['status' => 'draft']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('projects.data', 1)
        );
});

it('shows the create project form', function () {
    $user = User::factory()->contentManager()->create();

    $response = $this->actingAs($user)
        ->get(route('admin.content-studio.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/content-studio/create')
            ->has('modeOptions')
            ->has('educationLevels')
            ->has('curriculumSubjects')
            ->has('disciplines')
        );
});

it('creates a secondary content project', function () {
    $user = User::factory()->admin()->create();
    $level = EducationLevel::factory()->create();
    $subject = CurriculumSubject::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('admin.content-studio.store'), [
            'mode' => 'secondary',
            'education_level_id' => $level->id,
            'curriculum_subject_id' => $subject->id,
        ]);

    $response->assertRedirect(route('admin.content-studio.index'));

    $this->assertDatabaseHas('content_projects', [
        'mode' => 'secondary',
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
        'created_by' => $user->id,
        'status' => 'draft',
    ]);
});

it('creates a tertiary content project', function () {
    $user = User::factory()->admin()->create();
    $discipline = Discipline::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('admin.content-studio.store'), [
            'mode' => 'tertiary',
            'discipline_id' => $discipline->id,
        ]);

    $response->assertRedirect(route('admin.content-studio.index'));

    $this->assertDatabaseHas('content_projects', [
        'mode' => 'tertiary',
        'discipline_id' => $discipline->id,
        'created_by' => $user->id,
    ]);
});

it('requires education_level_id for secondary mode', function () {
    $user = User::factory()->admin()->create();
    $subject = CurriculumSubject::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('admin.content-studio.store'), [
            'mode' => 'secondary',
            'curriculum_subject_id' => $subject->id,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['education_level_id']);
});

it('requires discipline_id for tertiary mode', function () {
    $user = User::factory()->admin()->create();

    $response = $this->actingAs($user)
        ->postJson(route('admin.content-studio.store'), [
            'mode' => 'tertiary',
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['discipline_id']);
});

it('prevents duplicate in-progress projects', function () {
    $user = User::factory()->admin()->create();
    $level = EducationLevel::factory()->create();
    $subject = CurriculumSubject::factory()->create();

    ContentProject::factory()->create([
        'mode' => ContentProjectMode::Secondary,
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
        'status' => ContentProjectStatus::Research,
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('admin.content-studio.store'), [
            'mode' => 'secondary',
            'education_level_id' => $level->id,
            'curriculum_subject_id' => $subject->id,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['mode']);
});

it('allows duplicate if existing project is complete', function () {
    $user = User::factory()->admin()->create();
    $level = EducationLevel::factory()->create();
    $subject = CurriculumSubject::factory()->create();

    ContentProject::factory()->create([
        'mode' => ContentProjectMode::Secondary,
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
        'status' => ContentProjectStatus::Complete,
        'created_by' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.content-studio.store'), [
            'mode' => 'secondary',
            'education_level_id' => $level->id,
            'curriculum_subject_id' => $subject->id,
        ]);

    $response->assertRedirect(route('admin.content-studio.index'));
    $this->assertDatabaseCount('content_projects', 2);
});

it('shows a content project', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->create(['created_by' => $user->id]);

    $response = $this->actingAs($user)
        ->get(route('admin.content-studio.show', $project));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/content-studio/show')
            ->has('project')
        );
});

it('prevents students from accessing content studio', function () {
    $student = User::factory()->create(['role' => UserRole::Student]);

    $response = $this->actingAs($student)
        ->get(route('admin.content-studio.index'));

    $response->assertForbidden();
});

it('prevents unauthenticated access', function () {
    $response = $this->get(route('admin.content-studio.index'));

    $response->assertRedirect(route('login'));
});

it('rejects invalid mode value', function () {
    $user = User::factory()->admin()->create();

    $response = $this->actingAs($user)
        ->postJson(route('admin.content-studio.store'), [
            'mode' => 'invalid',
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['mode']);
});
