<?php

use App\Enums\QuestionStatus;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionContext;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
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

test('papers index shows published papers for enrolled courses', function () {
    QuestionPaper::factory()->published()->count(3)->create([
        'institution_course_id' => $this->course->id,
    ]);

    $this->get(route('questions.papers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('questions/index')
            ->where('tab', 'papers')
            ->has('papers.data', 3)
            ->has('paperFilterOptions')
            ->where('paperCount', 3)
        );
});

test('papers index hides unpublished papers', function () {
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);
    QuestionPaper::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => false,
    ]);

    $this->get(route('questions.papers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.data', 1)
        );
});

test('papers index hides papers from non-enrolled courses', function () {
    $otherCourse = InstitutionCourse::factory()->create();

    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $otherCourse->id,
    ]);

    $this->get(route('questions.papers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.data', 1)
        );
});

test('papers index filters by course', function () {
    $course2 = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course2->id,
    ]);

    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $course2->id,
    ]);

    $this->get(route('questions.papers.index', ['course_id' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.data', 1)
        );
});

test('papers index filters by year', function () {
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
        'year' => 2023,
    ]);
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
        'year' => 2022,
    ]);

    $this->get(route('questions.papers.index', ['year' => 2023]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.data', 1)
        );
});

test('papers index filters by semester', function () {
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
        'semester' => 'First Semester',
    ]);
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
        'semester' => 'Second Semester',
    ]);

    $this->get(route('questions.papers.index', ['semester' => 'First']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.data', 1)
        );
});

test('papers index paginates at 15 per page', function () {
    QuestionPaper::factory()->published()->count(20)->create([
        'institution_course_id' => $this->course->id,
    ]);

    $this->get(route('questions.papers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.data', 15)
            ->where('papers.meta.total', 20)
        );
});

test('papers index provides filter options', function () {
    QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
        'year' => 2023,
    ]);

    $this->get(route('questions.papers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('paperFilterOptions.courses', 1)
            ->has('paperFilterOptions.years', 1)
        );
});

test('papers index sets tab prop to papers', function () {
    $this->get(route('questions.papers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tab', 'papers')
        );
});

test('paper show renders paper with sections and questions', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);
    $section = QuestionSection::factory()->create([
        'question_paper_id' => $paper->id,
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.papers.show', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('questions/papers/show')
            ->has('paper')
            ->where('paper.id', $paper->id)
            ->has('paper.sections', 1)
        );
});

test('paper show loads hierarchical questions', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);
    $section = QuestionSection::factory()->create([
        'question_paper_id' => $paper->id,
    ]);
    $parent = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'parent_question_id' => null,
        'status' => QuestionStatus::Published,
    ]);
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'parent_question_id' => $parent->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('questions.papers.show', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('paper.sections.0.questions', 1)
            ->has('paper.sections.0.questions.0.children', 1)
        );
});

test('paper show loads published answers only', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);
    $section = QuestionSection::factory()->create([
        'question_paper_id' => $paper->id,
    ]);
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'status' => QuestionStatus::Published,
    ]);
    QuestionAnswer::factory()->quick()->create([
        'question_id' => $question->id,
        'is_published' => true,
    ]);
    QuestionAnswer::factory()->deepDive()->create([
        'question_id' => $question->id,
        'is_published' => false,
    ]);

    $this->get(route('questions.papers.show', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('paper.sections.0.questions.0.answers', 1)
        );
});

test('paper show returns 403 for non-enrolled course paper', function () {
    $otherCourse = InstitutionCourse::factory()->create();
    $paper = QuestionPaper::factory()->published()->create([
        'institution_course_id' => $otherCourse->id,
    ]);

    $this->get(route('questions.papers.show', $paper))
        ->assertForbidden();
});

test('paper show returns 404 for unpublished paper', function () {
    $paper = QuestionPaper::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => false,
    ]);

    $this->get(route('questions.papers.show', $paper))
        ->assertNotFound();
});

test('paper show loads contexts', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);
    QuestionContext::factory()->create([
        'question_paper_id' => $paper->id,
    ]);

    $this->get(route('questions.papers.show', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('paper.contexts', 1)
        );
});

test('paper show guests redirect to login', function () {
    auth()->logout();

    $paper = QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);

    $this->get(route('questions.papers.show', $paper))
        ->assertRedirect(route('login'));
});

test('paper show unboarded students redirect to onboarding', function () {
    $newStudent = User::factory()->create();

    $paper = QuestionPaper::factory()->published()->create([
        'institution_course_id' => $this->course->id,
    ]);

    $this->actingAs($newStudent)
        ->get(route('questions.papers.show', $paper))
        ->assertRedirect(route('onboarding.index'));
});
