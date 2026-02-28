<?php

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseBlockMapping;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\LevelSubject;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->educationSystem = EducationSystem::factory()->create();
    $this->discipline = Discipline::factory()->create();
});

test('index renders curriculum mappings page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.curriculum-mappings.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/curriculum-mappings/index')
            ->has('educationSystems')
            ->has('teachingDepths')
        );
});

test('load returns mappings and topics for level subject', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create([
        'discipline_id' => $this->discipline->id,
    ]);

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $topic = CanonicalTopic::factory()->for($this->discipline)->create(['is_published' => true]);
    $block = ContentBlock::factory()->published()->create(['canonical_topic_id' => $topic->id]);

    CourseBlockMapping::factory()->forLevelSubject()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'content_block_id' => $block->id,
    ]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.curriculum-mappings.load'), [
            'education_level_id' => $level->id,
            'curriculum_subject_id' => $subject->id,
        ])
        ->assertOk()
        ->assertJsonStructure(['level_subject_id', 'mappings', 'topics'])
        ->assertJsonCount(1, 'mappings')
        ->assertJsonCount(1, 'topics');
});

test('load creates level subject if not exists', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create([
        'discipline_id' => $this->discipline->id,
    ]);

    $this->assertDatabaseMissing('level_subjects', [
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.curriculum-mappings.load'), [
            'education_level_id' => $level->id,
            'curriculum_subject_id' => $subject->id,
        ])
        ->assertOk()
        ->assertJsonStructure(['level_subject_id']);

    $this->assertDatabaseHas('level_subjects', [
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);
});

test('update saves curriculum block mappings', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create([
        'discipline_id' => $this->discipline->id,
    ]);

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $topic = CanonicalTopic::factory()->for($this->discipline)->create(['is_published' => true]);
    $block = ContentBlock::factory()->published()->create(['canonical_topic_id' => $topic->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.curriculum-mappings.update'), [
            'curriculum_subject_level_id' => $levelSubject->id,
            'mappings' => [
                [
                    'content_block_id' => $block->id,
                    'teaching_depth' => 'intermediate',
                    'is_core_block' => true,
                ],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Curriculum block mappings updated.');

    $this->assertDatabaseHas('course_block_mappings', [
        'curriculum_subject_level_id' => $levelSubject->id,
        'content_block_id' => $block->id,
        'teaching_depth' => 'intermediate',
        'is_core_block' => true,
        'institution_course_id' => null,
    ]);
});

test('update replaces existing mappings', function () {
    $tier = CurriculumTier::factory()->for($this->educationSystem)->create();
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->for($this->educationSystem)->create([
        'discipline_id' => $this->discipline->id,
    ]);

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $topic = CanonicalTopic::factory()->for($this->discipline)->create(['is_published' => true]);
    $block1 = ContentBlock::factory()->published()->create(['canonical_topic_id' => $topic->id, 'path' => '1']);
    $block2 = ContentBlock::factory()->published()->create(['canonical_topic_id' => $topic->id, 'path' => '2', 'sort_order' => 2]);

    CourseBlockMapping::factory()->forLevelSubject()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'content_block_id' => $block1->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.curriculum-mappings.update'), [
            'curriculum_subject_level_id' => $levelSubject->id,
            'mappings' => [
                [
                    'content_block_id' => $block2->id,
                    'teaching_depth' => 'advanced',
                    'is_core_block' => false,
                ],
            ],
        ])
        ->assertRedirect();

    expect(CourseBlockMapping::where('curriculum_subject_level_id', $levelSubject->id)->count())->toBe(1);
    $this->assertDatabaseMissing('course_block_mappings', ['content_block_id' => $block1->id, 'curriculum_subject_level_id' => $levelSubject->id]);
    $this->assertDatabaseHas('course_block_mappings', ['content_block_id' => $block2->id, 'teaching_depth' => 'advanced']);
});

test('update validates required fields', function () {
    $this->actingAs($this->admin)
        ->put(route('admin.curriculum-mappings.update'), [
            'mappings' => [
                ['content_block_id' => 'invalid'],
            ],
        ])
        ->assertSessionHasErrors(['curriculum_subject_level_id', 'mappings.0.content_block_id', 'mappings.0.teaching_depth', 'mappings.0.is_core_block']);
});

test('unauthenticated user is redirected', function () {
    $this->get(route('admin.curriculum-mappings.index'))
        ->assertRedirect(route('login'));
});
