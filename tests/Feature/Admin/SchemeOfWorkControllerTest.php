<?php

use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->educationSystem = EducationSystem::factory()->create();
});

test('index renders scheme of work page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.scheme-of-work.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/scheme-of-work/index')
            ->has('educationSystems')
            ->has('topics')
        );
});

test('load returns items for existing level subject', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create();

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    SchemeOfWorkItem::factory()->count(2)->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
    ]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.scheme-of-work.load'), [
            'education_level_id' => $level->id,
            'curriculum_subject_id' => $subject->id,
            'term' => 1,
        ])
        ->assertOk()
        ->assertJsonStructure(['level_subject_id', 'items'])
        ->assertJsonCount(2, 'items');
});

test('load creates level subject if not exists', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create();

    $this->assertDatabaseMissing('level_subjects', [
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.scheme-of-work.load'), [
            'education_level_id' => $level->id,
            'curriculum_subject_id' => $subject->id,
            'term' => 1,
        ])
        ->assertOk()
        ->assertJsonStructure(['level_subject_id', 'items']);

    $this->assertDatabaseHas('level_subjects', [
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);
});

test('update saves scheme items', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create();

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.scheme-of-work.update'), [
            'curriculum_subject_level_id' => $levelSubject->id,
            'term' => 1,
            'items' => [
                ['week_number' => 1, 'topic_label' => 'Introduction to Algebra'],
                ['week_number' => 2, 'topic_label' => 'Linear Equations'],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Scheme of work updated.');

    $this->assertDatabaseHas('scheme_of_work_items', [
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 1,
        'topic_label' => 'Introduction to Algebra',
    ]);
    $this->assertDatabaseHas('scheme_of_work_items', [
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 2,
        'topic_label' => 'Linear Equations',
    ]);
});

test('update replaces existing items for same term', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create();

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 1,
        'topic_label' => 'Old Topic',
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.scheme-of-work.update'), [
            'curriculum_subject_level_id' => $levelSubject->id,
            'term' => 1,
            'items' => [
                ['week_number' => 1, 'topic_label' => 'New Topic'],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseMissing('scheme_of_work_items', ['topic_label' => 'Old Topic']);
    $this->assertDatabaseHas('scheme_of_work_items', ['topic_label' => 'New Topic']);
    expect(SchemeOfWorkItem::where('curriculum_subject_level_id', $levelSubject->id)->where('term', 1)->count())->toBe(1);
});

test('update validates term range 1-3', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create();

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.scheme-of-work.update'), [
            'curriculum_subject_level_id' => $levelSubject->id,
            'term' => 4,
            'items' => [],
        ])
        ->assertSessionHasErrors(['term']);
});

test('update validates week_number range 1-13', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create();

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.scheme-of-work.update'), [
            'curriculum_subject_level_id' => $levelSubject->id,
            'term' => 1,
            'items' => [
                ['week_number' => 14, 'topic_label' => 'Overflow Week'],
            ],
        ])
        ->assertSessionHasErrors(['items.0.week_number']);
});

test('update validates topic_label is required', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create();

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.scheme-of-work.update'), [
            'curriculum_subject_level_id' => $levelSubject->id,
            'term' => 1,
            'items' => [
                ['week_number' => 1],
            ],
        ])
        ->assertSessionHasErrors(['items.0.topic_label']);
});

test('unauthenticated user is redirected', function () {
    $this->get(route('admin.scheme-of-work.index'))
        ->assertRedirect(route('login'));
});
