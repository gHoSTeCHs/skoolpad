<?php

use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\Discipline;
use App\Models\InstitutionCourse;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->actingAs($this->admin);
});

test('index shows available topics from course discipline only', function () {
    $d1 = Discipline::factory()->create();
    $d2 = Discipline::factory()->create();
    $course = InstitutionCourse::factory()->create(['discipline_id' => $d1->id]);
    CanonicalTopic::factory()->count(3)->create(['discipline_id' => $d1->id, 'is_published' => true]);
    CanonicalTopic::factory()->count(2)->create(['discipline_id' => $d2->id, 'is_published' => true]);

    $this->get(route('admin.courses.mappings', $course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/mappings')
            ->has('available_topics', 3)
            ->has('mapped_topics')
            ->has('weight_options')
            ->has('course')
        );
});

test('index excludes unpublished topics from available list', function () {
    $discipline = Discipline::factory()->create();
    $course = InstitutionCourse::factory()->create(['discipline_id' => $discipline->id]);
    CanonicalTopic::factory()->count(2)->create(['discipline_id' => $discipline->id, 'is_published' => true]);
    CanonicalTopic::factory()->unpublished()->count(3)->create(['discipline_id' => $discipline->id]);

    $this->get(route('admin.courses.mappings', $course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('available_topics', 2));
});

test('index excludes already-mapped topics from available list', function () {
    $discipline = Discipline::factory()->create();
    $course = InstitutionCourse::factory()->create(['discipline_id' => $discipline->id]);
    $mapped = CanonicalTopic::factory()->create(['discipline_id' => $discipline->id, 'is_published' => true]);
    $unmapped = CanonicalTopic::factory()->create(['discipline_id' => $discipline->id, 'is_published' => true]);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $course->id,
        'canonical_topic_id' => $mapped->id,
        'sequence_order' => 1,
    ]);

    $this->get(route('admin.courses.mappings', $course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('available_topics', 1)
            ->has('mapped_topics', 1)
        );
});

test('update saves sequence_order correctly', function () {
    $discipline = Discipline::factory()->create();
    $course = InstitutionCourse::factory()->create(['discipline_id' => $discipline->id]);
    $t1 = CanonicalTopic::factory()->create(['discipline_id' => $discipline->id, 'is_published' => true]);
    $t2 = CanonicalTopic::factory()->create(['discipline_id' => $discipline->id, 'is_published' => true]);
    $t3 = CanonicalTopic::factory()->create(['discipline_id' => $discipline->id, 'is_published' => true]);

    $this->put(route('admin.courses.mappings.update', $course), [
        'mappings' => [
            ['canonical_topic_id' => $t1->id, 'sequence_order' => 1, 'weight' => 'core'],
            ['canonical_topic_id' => $t2->id, 'sequence_order' => 2, 'weight' => 'supplementary'],
            ['canonical_topic_id' => $t3->id, 'sequence_order' => 3, 'weight' => 'optional'],
        ],
    ])->assertRedirect();

    $this->assertDatabaseHas('course_topic_mappings', [
        'institution_course_id' => $course->id,
        'canonical_topic_id' => $t1->id,
        'sequence_order' => 1,
        'weight' => 'core',
    ]);
    $this->assertDatabaseHas('course_topic_mappings', [
        'institution_course_id' => $course->id,
        'canonical_topic_id' => $t2->id,
        'sequence_order' => 2,
        'weight' => 'supplementary',
    ]);
    $this->assertDatabaseHas('course_topic_mappings', [
        'institution_course_id' => $course->id,
        'canonical_topic_id' => $t3->id,
        'sequence_order' => 3,
        'weight' => 'optional',
    ]);
});

test('update rejects invalid weight value', function () {
    $discipline = Discipline::factory()->create();
    $course = InstitutionCourse::factory()->create(['discipline_id' => $discipline->id]);
    $topic = CanonicalTopic::factory()->create(['discipline_id' => $discipline->id, 'is_published' => true]);

    $this->put(route('admin.courses.mappings.update', $course), [
        'mappings' => [
            ['canonical_topic_id' => $topic->id, 'sequence_order' => 1, 'weight' => 'invalid'],
        ],
    ])->assertSessionHasErrors('mappings.0.weight');
});

test('update replaces all mappings on save', function () {
    $discipline = Discipline::factory()->create();
    $course = InstitutionCourse::factory()->create(['discipline_id' => $discipline->id]);
    $topics = CanonicalTopic::factory()->count(5)->create(['discipline_id' => $discipline->id, 'is_published' => true]);

    foreach ($topics as $i => $topic) {
        CourseTopicMapping::factory()->create([
            'institution_course_id' => $course->id,
            'canonical_topic_id' => $topic->id,
            'sequence_order' => $i + 1,
        ]);
    }

    expect(CourseTopicMapping::where('institution_course_id', $course->id)->count())->toBe(5);

    $this->put(route('admin.courses.mappings.update', $course), [
        'mappings' => [
            ['canonical_topic_id' => $topics[0]->id, 'sequence_order' => 1, 'weight' => 'core'],
            ['canonical_topic_id' => $topics[1]->id, 'sequence_order' => 2, 'weight' => 'core'],
        ],
    ])->assertRedirect();

    expect(CourseTopicMapping::where('institution_course_id', $course->id)->count())->toBe(2);
});

test('update validates canonical_topic_id exists', function () {
    $course = InstitutionCourse::factory()->create();
    $fakeUuid = '00000000-0000-0000-0000-000000000000';

    $this->put(route('admin.courses.mappings.update', $course), [
        'mappings' => [
            ['canonical_topic_id' => $fakeUuid, 'sequence_order' => 1, 'weight' => 'core'],
        ],
    ])->assertSessionHasErrors('mappings.0.canonical_topic_id');
});

test('update accepts empty mappings array', function () {
    $discipline = Discipline::factory()->create();
    $course = InstitutionCourse::factory()->create(['discipline_id' => $discipline->id]);
    $topic = CanonicalTopic::factory()->create(['discipline_id' => $discipline->id, 'is_published' => true]);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $course->id,
        'canonical_topic_id' => $topic->id,
        'sequence_order' => 1,
    ]);

    $this->put(route('admin.courses.mappings.update', $course), [
        'mappings' => [],
    ])->assertRedirect();

    expect(CourseTopicMapping::where('institution_course_id', $course->id)->count())->toBe(0);
});

test('guests cannot access course mapping routes', function () {
    auth()->logout();
    $course = InstitutionCourse::factory()->create();

    $this->get(route('admin.courses.mappings', $course))->assertRedirect(route('login'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();
    $course = InstitutionCourse::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.courses.mappings', $course))
        ->assertForbidden();
});
