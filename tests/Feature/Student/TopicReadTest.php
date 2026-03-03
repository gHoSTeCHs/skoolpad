<?php

use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->institution = Institution::factory()->create();
    $this->faculty = Faculty::factory()->for($this->institution)->create();
    $this->department = Department::factory()->for($this->faculty)->create();

    $this->profile = StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
    ]);

    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);

    $this->topic = CanonicalTopic::factory()->create(['is_published' => true]);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topic->id,
        'sequence_order' => 1,
    ]);

    $this->actingAs($this->student);
});

test('topic read page renders with block tree', function () {
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'sort_order' => 1,
    ]);

    $this->get(route('topics.read', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('topics/read')
            ->has('topic')
            ->where('topic.title', $this->topic->title)
            ->has('blockTree', 1)
        );
});

test('topic read page renders for topic without blocks', function () {
    $this->get(route('topics.read', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('topics/read')
            ->where('blockTree', null)
        );
});

test('completed block ids are included', function () {
    $block = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'sort_order' => 1,
    ]);

    BlockCompletion::factory()->create([
        'user_id' => $this->student->id,
        'content_block_id' => $block->id,
    ]);

    $this->get(route('topics.read', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('completedBlockIds', 1)
            ->where('completedBlockIds.0', $block->id)
        );
});

test('course context is passed through', function () {
    $this->get(route('topics.read', [$this->topic, 'course' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('courseContext')
            ->where('courseContext.id', $this->course->id)
            ->where('courseContext.course_code', $this->course->course_code)
        );
});

test('total read time is calculated from blocks', function () {
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'path' => '1',
        'sort_order' => 1,
        'estimated_read_time' => 5,
    ]);

    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'path' => '2',
        'sort_order' => 2,
        'estimated_read_time' => 3,
    ]);

    $this->get(route('topics.read', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('totalReadTime', 8)
        );
});

test('guests cannot access topic read page', function () {
    auth()->logout();

    $this->get(route('topics.read', $this->topic))
        ->assertRedirect(route('login'));
});
