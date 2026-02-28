<?php

use App\Enums\QuestionStatus;
use App\Models\CanonicalTopic;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionContext;
use App\Models\QuestionTopicLink;
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

    $this->actingAs($this->student);
});

test('index shows questions from enrolled courses', function () {
    Question::factory()->count(3)->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('questions/index')
            ->has('questions.data', 3)
            ->has('filterOptions')
            ->where('totalCount', 3)
        );
});

test('index only shows published questions', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Draft,
    ]);

    $this->get(route('questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index filters by course', function () {
    $course2 = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course2->id,
    ]);

    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);
    Question::factory()->create([
        'institution_course_id' => $course2->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.index', ['course_id' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index filters by year', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2023,
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2022,
    ]);

    $this->get(route('questions.index', ['year' => 2023]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index filters by semester', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'semester' => 'first',
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'semester' => 'second',
    ]);

    $this->get(route('questions.index', ['semester' => 'first']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index filters by topic', function () {
    $topic = CanonicalTopic::factory()->create();
    $q1 = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);
    QuestionTopicLink::factory()->create([
        'question_id' => $q1->id,
        'canonical_topic_id' => $topic->id,
    ]);

    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.index', ['topic_id' => $topic->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index filters by difficulty', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'difficulty_level' => 'easy',
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'difficulty_level' => 'hard',
    ]);

    $this->get(route('questions.index', ['difficulty' => 'easy']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index filters by type', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'question_type' => 'mcq',
    ]);
    Question::factory()->theory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.index', ['type' => 'mcq']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index combines multiple filters', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2023,
        'difficulty_level' => 'easy',
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2023,
        'difficulty_level' => 'hard',
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2022,
        'difficulty_level' => 'easy',
    ]);

    $this->get(route('questions.index', ['year' => 2023, 'difficulty' => 'easy']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('index cursor paginates with load more', function () {
    Question::factory()->count(20)->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 15)
            ->where('questions.has_more', true)
        );
});

test('index shows empty state when no questions', function () {
    $this->get(route('questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 0)
            ->where('totalCount', 0)
        );
});

test('show renders individual question', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.show', $question))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('questions/show')
            ->has('question')
            ->where('question.id', $question->id)
        );
});

test('show returns 403 for non-enrolled course question', function () {
    $otherCourse = InstitutionCourse::factory()->create();
    $question = Question::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.show', $question))
        ->assertForbidden();
});

test('guests cannot access questions', function () {
    auth()->logout();

    $this->get(route('questions.index'))->assertRedirect(route('login'));
});

test('unboarded students cannot access questions', function () {
    $newStudent = User::factory()->create();

    $this->actingAs($newStudent)
        ->get(route('questions.index'))
        ->assertRedirect(route('onboarding.index'));
});

test('question browser includes contexts with questions', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $context = QuestionContext::factory()->reusable()->create();

    $question->contexts()->attach($context->id, ['sort_order' => 1, 'label' => 'Read the passage']);

    $this->get(route('questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
            ->where('questions.data.0.contexts.0.id', $context->id)
            ->where('questions.data.0.contexts.0.context_type', $context->context_type->value)
        );
});

test('browse_all shows questions from entire institution', function () {
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);
    Question::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );

    $this->get(route('questions.index', ['browse_all' => 'true']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 2)
            ->where('appliedFilters.browse_all', 'true')
        );
});
