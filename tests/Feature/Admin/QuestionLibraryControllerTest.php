<?php

use App\Models\ExamSubject;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionPaper;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->institution = Institution::factory()->create(['is_active' => true]);
    $this->course = InstitutionCourse::factory()->for($this->institution)->create();
});

test('index returns correct counts and tab data for the library landing', function () {
    // 2 papers with questions
    $paperA = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    $paperB = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => false]);
    $paperQ = Question::factory()->create(['question_paper_id' => $paperA->id, 'institution_course_id' => null]);
    QuestionAnswer::factory()->create(['question_id' => $paperQ->id, 'is_published' => true]);

    // 1 course-pool question (no paper, has institution_course)
    $poolCourse = InstitutionCourse::factory()->for($this->institution)->create();
    Question::factory()->create([
        'question_paper_id' => null,
        'institution_course_id' => $poolCourse->id,
        'exam_subject_id' => null,
    ]);

    // 1 exam-subject pool question
    $subject = ExamSubject::factory()->create();
    Question::factory()->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => $subject->id,
    ]);

    // 2 unattached questions
    Question::factory()->count(2)->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-library.preview'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/preview/question-library/index')
            ->where('counts.papers', 2)
            ->where('counts.course_pools', 1)
            ->where('counts.exam_subject_pools', 1)
            ->where('counts.unattached', 2)
            ->has('papers', 2)
            ->has('course_pools', 1)
            ->has('exam_subject_pools', 1)
            ->has('unattached_questions', 2)
        );
});

test('papers carry answer fill stats', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $q = Question::factory()->create(['question_paper_id' => $paper->id, 'institution_course_id' => null]);
    QuestionAnswer::factory()->quick()->create(['question_id' => $q->id, 'is_published' => true]);
    QuestionAnswer::factory()->create(['question_id' => $q->id, 'is_published' => false]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-library.preview'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.0', fn ($paper) => $paper
                ->where('answers_filled', 2)
                ->where('answers_published', 1)
                ->where('answers_total_slots', 3)
                ->etc()
            )
        );
});

test('search endpoint returns grouped results', function () {
    QuestionPaper::factory()->create([
        'institution_course_id' => $this->course->id,
        'title' => 'Advanced Algorithms Final',
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.question-library.preview.search', ['q' => 'Algorithms']))
        ->assertOk()
        ->assertJsonStructure([
            'results' => ['papers', 'course_pools', 'exam_pools', 'questions'],
        ])
        ->assertJsonPath('results.papers.0.title', 'Advanced Algorithms Final');
});

test('search returns empty groups when query is blank', function () {
    QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.question-library.preview.search', ['q' => '']))
        ->assertOk()
        ->assertJsonPath('results.papers', [])
        ->assertJsonPath('results.course_pools', [])
        ->assertJsonPath('results.exam_pools', [])
        ->assertJsonPath('results.questions', []);
});

test('students cannot access the library', function () {
    $student = User::factory()->create();

    $this->actingAs($student)
        ->get(route('admin.question-library.preview'))
        ->assertForbidden();
});
