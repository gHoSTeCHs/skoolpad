<?php

use App\Enums\AnswerDepthLevel;
use App\Models\AssessmentType;
use App\Models\EducationSystem;
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

function validPaperData(array $overrides = []): array
{
    return array_merge([
        'title' => 'CSC 224 Final Exam',
        'institution_course_id' => test()->course->id,
        'academic_session' => '2024/2025',
        'semester' => 'first',
        'total_marks' => 100,
        'duration_minutes' => 120,
        'instructions' => 'Answer all questions in Section A.',
    ], $overrides);
}

test('index displays papers with pagination', function () {
    QuestionPaper::factory()->count(3)->create(['institution_course_id' => $this->course->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/question-papers/index')
            ->has('papers.data', 3)
            ->has('papers.meta.current_page')
            ->has('papers.meta.total')
            ->has('institutions')
            ->has('assessment_types')
        );
});

test('index filters by search', function () {
    QuestionPaper::factory()->create(['title' => 'CSC 224 Final Exam', 'institution_course_id' => $this->course->id]);
    QuestionPaper::factory()->create(['title' => 'MTH 101 Test', 'institution_course_id' => $this->course->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.index', ['search' => 'CSC']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('papers.data', 1));
});

test('index filters by institution', function () {
    $otherInstitution = Institution::factory()->create();
    $otherCourse = InstitutionCourse::factory()->for($otherInstitution)->create();

    QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    QuestionPaper::factory()->create(['institution_course_id' => $otherCourse->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.index', ['institution_id' => $this->institution->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('papers.data', 1));
});

test('index filters by assessment type', function () {
    $system = EducationSystem::factory()->create();
    $assessmentType = AssessmentType::factory()->create(['education_system_id' => $system->id]);

    QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    QuestionPaper::factory()->forAssessmentType()->create(['assessment_type_id' => $assessmentType->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.index', ['assessment_type_id' => $assessmentType->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('papers.data', 1));
});

test('create page renders', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/question-papers/create')
            ->has('institutions')
            ->has('assessment_types')
        );
});

test('store creates paper and redirects to build', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.store'), validPaperData())
        ->assertRedirect();

    $this->assertDatabaseHas('question_papers', [
        'title' => 'CSC 224 Final Exam',
        'institution_course_id' => $this->course->id,
        'total_marks' => 100,
    ]);
});

test('store validates required title', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.store'), validPaperData(['title' => '']))
        ->assertSessionHasErrors('title');
});

test('store validates institution_course_id exists', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.store'), validPaperData(['institution_course_id' => 'nonexistent-uuid']))
        ->assertSessionHasErrors('institution_course_id');
});

test('build page loads paper with nested data', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $section = QuestionSection::factory()->create(['question_paper_id' => $paper->id]);
    Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.build', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/question-papers/build')
            ->has('paper')
            ->has('paper.sections', 1)
            ->has('paper.sections.0.questions', 1)
            ->has('enum_options.question_types')
            ->has('enum_options.difficulties')
            ->has('enum_options.bloom_levels')
            ->has('enum_options.context_types')
        );
});

test('build preview page loads paper with same payload shape as build', function () {
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
        ->get(route('admin.question-papers.build-preview', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/preview/question-papers/build')
            ->has('paper')
            ->has('paper.sections', 1)
            ->has('paper.sections.0.questions', 1)
            ->has('paper.sections.0.questions.0.answers', 1)
            ->has('enum_options.question_types')
            ->has('enum_options.difficulties')
            ->has('enum_options.bloom_levels')
            ->has('enum_options.context_types')
        );
});

test('build preview is staff-gated', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);

    $this->get(route('admin.question-papers.build-preview', $paper))
        ->assertRedirect(route('login'));
});

test('build eager-loads answers on top-level questions', function () {
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
    QuestionAnswer::factory()->for($question)->create([
        'depth_level' => AnswerDepthLevel::Standard,
        'is_published' => false,
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.build', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/question-papers/build')
            ->has('paper.sections.0.questions.0.answers', 2)
            ->has('paper.sections.0.questions.0.answers.0', fn ($answer) => $answer
                ->has('id')
                ->has('depth_level')
                ->has('is_published')
                ->etc()
            )
        );
});

test('build eager-loads answers on nested child questions', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $section = QuestionSection::factory()->create(['question_paper_id' => $paper->id]);
    $parent = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);
    $child = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'parent_question_id' => $parent->id,
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);
    QuestionAnswer::factory()->for($child)->create([
        'depth_level' => AnswerDepthLevel::DeepDive,
        'is_published' => true,
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-papers.build', $paper))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('paper.sections.0.questions.0.children.0.answers', 1)
            ->where('paper.sections.0.questions.0.children.0.answers.0.depth_level', 'deep_dive')
            ->where('paper.sections.0.questions.0.children.0.answers.0.is_published', true)
        );
});

test('update modifies paper metadata', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.question-papers.update', $paper), validPaperData(['title' => 'Updated Title']))
        ->assertRedirect();

    expect($paper->fresh()->title)->toBe('Updated Title');
});

test('destroy deletes paper', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.question-papers.destroy', $paper))
        ->assertRedirect(route('admin.question-papers.index'));

    $this->assertDatabaseMissing('question_papers', ['id' => $paper->id]);
});

test('unauthenticated users cannot access papers', function () {
    $this->get(route('admin.question-papers.index'))->assertRedirect(route('login'));
});
