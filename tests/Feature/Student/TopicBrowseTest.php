<?php

use App\Enums\QuestionStatus;
use App\Enums\TopicDifficulty;
use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionTopicLink;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Models\TopicCompletion;
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

test('browse page renders with enrolled topics', function () {
    $this->get(route('topics.browse'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('topics/browse')
            ->has('topics.data', 1)
            ->where('topics.data.0.title', $this->topic->title)
            ->has('filterOptions')
            ->has('appliedFilters')
            ->has('totalCount')
            ->has('completedCount')
        );
});

test('browse page excludes unpublished topics', function () {
    $unpublished = CanonicalTopic::factory()->create(['is_published' => false]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $unpublished->id,
        'sequence_order' => 2,
    ]);

    $this->get(route('topics.browse'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $this->topic->id)
        );
});

test('browse page only shows enrolled course topics by default', function () {
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);
    $otherTopic = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'canonical_topic_id' => $otherTopic->id,
    ]);

    $this->get(route('topics.browse'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $this->topic->id)
        );
});

test('browse all shows all institutional topics', function () {
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);
    $otherTopic = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'canonical_topic_id' => $otherTopic->id,
    ]);

    $this->get(route('topics.browse', ['browse_all' => 'true']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 2)
            ->where('appliedFilters.browse_all', 'true')
        );
});

test('search filter works', function () {
    $topic2 = CanonicalTopic::factory()->create([
        'is_published' => true,
        'title' => 'Quantum Mechanics Basics',
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic2->id,
    ]);

    $this->get(route('topics.browse', ['search' => 'Quantum']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $topic2->id)
        );
});

test('difficulty filter works', function () {
    $this->topic->update(['difficulty_level' => TopicDifficulty::Advanced]);

    $easyTopic = CanonicalTopic::factory()->create([
        'is_published' => true,
        'difficulty_level' => TopicDifficulty::Foundational,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $easyTopic->id,
    ]);

    $this->get(route('topics.browse', ['difficulty' => 'foundational']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $easyTopic->id)
        );
});

test('course filter narrows results', function () {
    $course2 = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course2->id,
    ]);

    $topic2 = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $course2->id,
        'canonical_topic_id' => $topic2->id,
    ]);

    $this->get(route('topics.browse', ['course_id' => $course2->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $topic2->id)
        );
});

test('discipline filter works in browse all mode', function () {
    $discipline = Discipline::factory()->create();
    $this->topic->update(['discipline_id' => $discipline->id]);

    $otherDiscipline = Discipline::factory()->create();
    $otherTopic = CanonicalTopic::factory()->create([
        'is_published' => true,
        'discipline_id' => $otherDiscipline->id,
    ]);
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'canonical_topic_id' => $otherTopic->id,
    ]);

    $this->get(route('topics.browse', ['browse_all' => 'true', 'discipline_id' => $discipline->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $this->topic->id)
        );
});

test('completion filter shows completed topics', function () {
    TopicCompletion::factory()->create([
        'user_id' => $this->student->id,
        'canonical_topic_id' => $this->topic->id,
    ]);

    $topic2 = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic2->id,
    ]);

    $this->get(route('topics.browse', ['completion' => 'completed']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $this->topic->id)
            ->where('topics.data.0.is_completed', true)
        );
});

test('completion filter shows not started topics', function () {
    TopicCompletion::factory()->create([
        'user_id' => $this->student->id,
        'canonical_topic_id' => $this->topic->id,
    ]);

    $topic2 = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic2->id,
    ]);

    $this->get(route('topics.browse', ['completion' => 'not_started']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data', 1)
            ->where('topics.data.0.id', $topic2->id)
        );
});

test('topic items include block counts', function () {
    $block = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'is_container' => false,
    ]);

    BlockCompletion::factory()->create([
        'user_id' => $this->student->id,
        'content_block_id' => $block->id,
    ]);

    $this->get(route('topics.browse'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topics.data.0.total_blocks', 1)
            ->where('topics.data.0.completed_blocks', 1)
        );
});

test('topic items include question count', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    QuestionTopicLink::factory()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $this->topic->id,
    ]);

    $this->get(route('topics.browse'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topics.data.0.question_count', 1)
        );
});

test('topic items include course context', function () {
    $this->get(route('topics.browse'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topics.data.0.courses', 1)
            ->where('topics.data.0.courses.0.id', $this->course->id)
        );
});

test('guests cannot access browse page', function () {
    auth()->logout();

    $this->get(route('topics.browse'))
        ->assertRedirect(route('login'));
});
