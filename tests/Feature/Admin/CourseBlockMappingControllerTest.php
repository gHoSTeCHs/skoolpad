<?php

use App\Enums\TeachingDepth;
use App\Models\ContentBlock;
use App\Models\CourseBlockMapping;
use App\Models\InstitutionCourse;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->course = InstitutionCourse::factory()->create();
});

test('index renders block mappings page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.course-block-mappings.index', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/block-mappings')
            ->has('course.id')
            ->has('course.course_code')
            ->has('mappings')
            ->has('topics')
            ->has('teachingDepths')
        );
});

test('index shows existing mappings', function () {
    $block = ContentBlock::factory()->published()->create();
    CourseBlockMapping::factory()->for($this->course)->create([
        'content_block_id' => $block->id,
        'teaching_depth' => TeachingDepth::Intermediate,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.course-block-mappings.index', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('mappings', 1)
            ->where('mappings.0.teaching_depth', 'intermediate')
        );
});

test('update saves new mappings', function () {
    $block = ContentBlock::factory()->published()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.course-block-mappings.update', $this->course), [
            'mappings' => [
                [
                    'content_block_id' => $block->id,
                    'teaching_depth' => 'intermediate',
                    'is_core_block' => true,
                    'week_start' => 1,
                    'week_end' => 3,
                    'lecture_hours' => 2.5,
                    'lab_hours' => 1.0,
                ],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Block mappings updated.');

    $this->assertDatabaseHas('course_block_mappings', [
        'institution_course_id' => $this->course->id,
        'content_block_id' => $block->id,
        'teaching_depth' => 'intermediate',
        'is_core_block' => true,
        'week_start' => 1,
        'week_end' => 3,
    ]);
});

test('update replaces existing mappings', function () {
    $block1 = ContentBlock::factory()->published()->create();
    $block2 = ContentBlock::factory()->published()->create();

    CourseBlockMapping::factory()->for($this->course)->create([
        'content_block_id' => $block1->id,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.course-block-mappings.update', $this->course), [
            'mappings' => [
                [
                    'content_block_id' => $block2->id,
                    'teaching_depth' => 'advanced',
                    'is_core_block' => false,
                    'week_start' => null,
                    'week_end' => null,
                    'lecture_hours' => null,
                    'lab_hours' => null,
                ],
            ],
        ])
        ->assertRedirect();

    expect(CourseBlockMapping::where('institution_course_id', $this->course->id)->count())->toBe(1);
    $this->assertDatabaseMissing('course_block_mappings', ['content_block_id' => $block1->id]);
    $this->assertDatabaseHas('course_block_mappings', ['content_block_id' => $block2->id]);
});

test('update validates teaching depth is valid enum', function () {
    $block = ContentBlock::factory()->published()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.course-block-mappings.update', $this->course), [
            'mappings' => [
                [
                    'content_block_id' => $block->id,
                    'teaching_depth' => 'invalid_depth',
                    'is_core_block' => true,
                    'week_start' => null,
                    'week_end' => null,
                    'lecture_hours' => null,
                    'lab_hours' => null,
                ],
            ],
        ])
        ->assertSessionHasErrors(['mappings.0.teaching_depth']);
});

test('update validates week_end is gte week_start', function () {
    $block = ContentBlock::factory()->published()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.course-block-mappings.update', $this->course), [
            'mappings' => [
                [
                    'content_block_id' => $block->id,
                    'teaching_depth' => 'intermediate',
                    'is_core_block' => true,
                    'week_start' => 5,
                    'week_end' => 3,
                    'lecture_hours' => null,
                    'lab_hours' => null,
                ],
            ],
        ])
        ->assertSessionHasErrors(['mappings.0.week_end']);
});

test('unauthenticated user is redirected', function () {
    $this->get(route('admin.course-block-mappings.index', $this->course))
        ->assertRedirect(route('login'));
});
