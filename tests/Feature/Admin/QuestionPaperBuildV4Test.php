<?php

use App\Enums\AnswerDepthLevel;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->institution = Institution::factory()->create(['is_active' => true]);
    $this->course = InstitutionCourse::factory()->for($this->institution)->create();
});

test('v4 build page loads paper with nested data for staff', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $section = QuestionSection::factory()->create(['question_paper_id' => $paper->id]);
    Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.build-v4', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/question-papers/v4-build')
            ->has('paper')
            ->has('paper.sections', 1)
            ->has('paper.sections.0.questions', 1)
            ->has('enum_options.question_types')
            ->has('enum_options.difficulties')
            ->has('enum_options.bloom_levels')
            ->has('enum_options.context_types')
        );
});

test('v4 build is staff-gated; unauthenticated redirects to login', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);

    $this->get(route('admin.question-papers.build-v4', $paper))
        ->assertRedirect(route('login'));
});

test('v4 build returns 404 for missing paper UUID', function () {
    $this->actingAs($this->admin)
        ->get('/admin/question-papers/00000000-0000-0000-0000-000000000000/build-v4')
        ->assertNotFound();
});

test('v4 build payload shape matches /build (regression guard)', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $section = QuestionSection::factory()->create(['question_paper_id' => $paper->id]);
    $question = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);
    QuestionAnswer::factory()->for($question)->create([
        'depth_level' => AnswerDepthLevel::Quick,
        'is_published' => true,
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.build-v4', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('paper.sections.0.questions.0.answers', 1)
            ->has('paper.contexts')
            ->where('paper.sections.0.questions.0.answers.0.depth_level', 'quick')
            ->where('paper.sections.0.questions.0.answers.0.is_published', true)
        );
});
