<?php

use App\Enums\BloomLevel;
use App\Enums\ContextType;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionType;
use App\Enums\Relevance;
use App\Models\AssessmentType;
use App\Models\ContentBlock;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAssessmentLink;
use App\Models\QuestionBlockLink;
use App\Models\QuestionContext;
use App\Models\QuestionContextLink;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;

test('question paper can be created with factory', function () {
    $paper = QuestionPaper::factory()->create();

    expect($paper)->toBeInstanceOf(QuestionPaper::class)
        ->and($paper->title)->toBeString()
        ->and($paper->total_marks)->toBeInt()
        ->and($paper->duration_minutes)->toBeInt()
        ->and($paper->is_published)->toBeFalse();
});

test('question paper belongs to institution course', function () {
    $course = InstitutionCourse::factory()->create();
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $course->id]);

    expect($paper->institutionCourse->id)->toBe($course->id);
});

test('question paper for assessment type', function () {
    $paper = QuestionPaper::factory()->forAssessmentType()->create();

    expect($paper->assessmentType)->not->toBeNull()
        ->and($paper->institution_course_id)->toBeNull()
        ->and($paper->year)->toBeInt();
});

test('question paper has many sections', function () {
    $paper = QuestionPaper::factory()->create();
    QuestionSection::factory()->create(['question_paper_id' => $paper->id, 'sort_order' => 1]);
    QuestionSection::factory()->create(['question_paper_id' => $paper->id, 'sort_order' => 2]);

    expect($paper->sections)->toHaveCount(2);
});

test('question section belongs to paper', function () {
    $paper = QuestionPaper::factory()->create();
    $section = QuestionSection::factory()->create(['question_paper_id' => $paper->id]);

    expect($section->questionPaper->id)->toBe($paper->id)
        ->and($section->marks)->toBeInt()
        ->and($section->sort_order)->toBeInt();
});

test('question section allows duplicate sort order for reordering', function () {
    $paper = QuestionPaper::factory()->create();
    QuestionSection::factory()->create(['question_paper_id' => $paper->id, 'sort_order' => 1]);
    $second = QuestionSection::factory()->create(['question_paper_id' => $paper->id, 'sort_order' => 1]);

    expect($second)->toBeInstanceOf(QuestionSection::class);
});

test('question section with required count', function () {
    $section = QuestionSection::factory()->withRequiredCount(3)->create();

    expect($section->required_count)->toBe(3);
});

test('question context can be created with factory', function () {
    $context = QuestionContext::factory()->create();

    expect($context)->toBeInstanceOf(QuestionContext::class)
        ->and($context->context_type)->toBe(ContextType::Passage)
        ->and($context->title)->toBeString()
        ->and($context->content)->toBeString();
});

test('question context reusable state', function () {
    $context = QuestionContext::factory()->reusable()->create();

    expect($context->question_paper_id)->toBeNull();
});

test('question context diagram state', function () {
    $context = QuestionContext::factory()->diagram()->create();

    expect($context->context_type)->toBe(ContextType::Diagram)
        ->and($context->media_url)->toBeString()
        ->and($context->content)->toBeNull();
});

test('question context code snippet state', function () {
    $context = QuestionContext::factory()->codeSnippet('javascript')->create();

    expect($context->context_type)->toBe(ContextType::CodeSnippet)
        ->and($context->language)->toBe('javascript');
});

test('question context word bank state', function () {
    $context = QuestionContext::factory()->withWordBank()->create();

    expect($context->context_type)->toBe(ContextType::WordBank)
        ->and($context->word_bank)->toBeArray()
        ->and($context->word_bank)->toHaveCount(5);
});

test('question context table data state', function () {
    $context = QuestionContext::factory()->withTableData()->create();

    expect($context->context_type)->toBe(ContextType::Table)
        ->and($context->table_data)->toBeArray()
        ->and($context->table_data)->toHaveKeys(['headers', 'rows']);
});

test('question paper has many contexts', function () {
    $paper = QuestionPaper::factory()->create();
    QuestionContext::factory()->create(['question_paper_id' => $paper->id]);
    QuestionContext::factory()->create(['question_paper_id' => $paper->id]);

    expect($paper->contexts)->toHaveCount(2);
});

test('question new columns from redesign', function () {
    $paper = QuestionPaper::factory()->create();
    $section = QuestionSection::factory()->create(['question_paper_id' => $paper->id]);

    $question = Question::factory()->forPaper()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'question_number' => '1(a)',
        'display_label' => '(a)',
        'sort_order' => 1,
        'depth_level' => 1,
        'bloom_level' => BloomLevel::Apply,
        'is_published' => true,
    ]);

    expect($question->questionPaper->id)->toBe($paper->id)
        ->and($question->questionSection->id)->toBe($section->id)
        ->and($question->question_number)->toBe('1(a)')
        ->and($question->display_label)->toBe('(a)')
        ->and($question->sort_order)->toBe(1)
        ->and($question->depth_level)->toBe(1)
        ->and($question->bloom_level)->toBe(BloomLevel::Apply)
        ->and($question->is_published)->toBeTrue();
});

test('question self-referential parent-child relationship', function () {
    $parent = Question::factory()->group()->forPaper()->create([
        'question_number' => '1',
        'display_label' => 'Question 1',
        'depth_level' => 0,
        'sort_order' => 1,
    ]);

    $child1 = Question::factory()->forPaper()->create([
        'question_paper_id' => $parent->question_paper_id,
        'parent_question_id' => $parent->id,
        'question_number' => '1(a)',
        'display_label' => '(a)',
        'depth_level' => 1,
        'sort_order' => 1,
    ]);

    $child2 = Question::factory()->forPaper()->create([
        'question_paper_id' => $parent->question_paper_id,
        'parent_question_id' => $parent->id,
        'question_number' => '1(b)',
        'display_label' => '(b)',
        'depth_level' => 1,
        'sort_order' => 2,
    ]);

    expect($parent->children)->toHaveCount(2)
        ->and($child1->parent->id)->toBe($parent->id)
        ->and($child2->parent->id)->toBe($parent->id);
});

test('question depth level check constraint prevents values over 3', function () {
    expect(fn () => Question::factory()->create(['depth_level' => 4]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('question response_config is correctly cast to array', function () {
    $question = Question::factory()->create();

    expect($question->response_config)->toBeArray()
        ->and($question->response_config['options'])->toHaveCount(4)
        ->and($question->response_config['options'][0])->toHaveKeys(['label', 'text', 'is_correct']);
});

test('question group type has null marks', function () {
    $question = Question::factory()->group()->create();

    expect($question->question_type)->toBe(QuestionType::Group)
        ->and($question->marks)->toBeNull()
        ->and($question->response_config)->toBeNull();
});

test('question paper has many questions', function () {
    $paper = QuestionPaper::factory()->create();
    Question::factory()->forPaper()->create(['question_paper_id' => $paper->id]);
    Question::factory()->forPaper()->create(['question_paper_id' => $paper->id]);

    expect($paper->questions)->toHaveCount(2);
});

test('question section has many questions', function () {
    $paper = QuestionPaper::factory()->create();
    $section = QuestionSection::factory()->create(['question_paper_id' => $paper->id]);
    Question::factory()->forPaper()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
    ]);

    expect($section->questions)->toHaveCount(1);
});

test('question context link pivot', function () {
    $question = Question::factory()->create();
    $context = QuestionContext::factory()->reusable()->create();

    QuestionContextLink::create([
        'question_id' => $question->id,
        'question_context_id' => $context->id,
        'sort_order' => 1,
        'label' => 'Source 1',
    ]);

    $question->refresh();
    expect($question->contexts)->toHaveCount(1)
        ->and($question->contexts->first()->pivot->label)->toBe('Source 1')
        ->and($question->contexts->first()->pivot->sort_order)->toBe(1);
});

test('question context link unique constraint', function () {
    $question = Question::factory()->create();
    $context = QuestionContext::factory()->reusable()->create();

    QuestionContextLink::create([
        'question_id' => $question->id,
        'question_context_id' => $context->id,
    ]);

    expect(fn () => QuestionContextLink::create([
        'question_id' => $question->id,
        'question_context_id' => $context->id,
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('question block link pivot', function () {
    $question = Question::factory()->create();
    $block = ContentBlock::factory()->create();

    QuestionBlockLink::create([
        'question_id' => $question->id,
        'content_block_id' => $block->id,
        'relevance' => Relevance::Primary,
    ]);

    $question->refresh();
    expect($question->contentBlocks)->toHaveCount(1)
        ->and($question->contentBlocks->first()->pivot->relevance)->toBe(Relevance::Primary);
});

test('question block link unique constraint', function () {
    $question = Question::factory()->create();
    $block = ContentBlock::factory()->create();

    QuestionBlockLink::create([
        'question_id' => $question->id,
        'content_block_id' => $block->id,
        'relevance' => Relevance::Primary,
    ]);

    expect(fn () => QuestionBlockLink::create([
        'question_id' => $question->id,
        'content_block_id' => $block->id,
        'relevance' => Relevance::Secondary,
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('question assessment link pivot', function () {
    $question = Question::factory()->create();
    $assessmentType = AssessmentType::factory()->create();

    QuestionAssessmentLink::create([
        'question_id' => $question->id,
        'assessment_type_id' => $assessmentType->id,
        'year' => 2024,
    ]);

    $question->refresh();
    expect($question->assessmentTypes)->toHaveCount(1)
        ->and($question->assessmentTypes->first()->pivot->year)->toBe(2024);
});

test('question assessment link unique constraint', function () {
    $question = Question::factory()->create();
    $assessmentType = AssessmentType::factory()->create();

    QuestionAssessmentLink::create([
        'question_id' => $question->id,
        'assessment_type_id' => $assessmentType->id,
        'year' => 2024,
    ]);

    expect(fn () => QuestionAssessmentLink::create([
        'question_id' => $question->id,
        'assessment_type_id' => $assessmentType->id,
        'year' => 2024,
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('question assessment link allows same question and assessment with different years', function () {
    $question = Question::factory()->create();
    $assessmentType = AssessmentType::factory()->create();

    QuestionAssessmentLink::create([
        'question_id' => $question->id,
        'assessment_type_id' => $assessmentType->id,
        'year' => 2023,
    ]);

    QuestionAssessmentLink::create([
        'question_id' => $question->id,
        'assessment_type_id' => $assessmentType->id,
        'year' => 2024,
    ]);

    expect($question->assessmentTypes)->toHaveCount(2);
});

test('content block has many question block links', function () {
    $block = ContentBlock::factory()->create();
    $q1 = Question::factory()->create();
    $q2 = Question::factory()->create();

    QuestionBlockLink::create(['question_id' => $q1->id, 'content_block_id' => $block->id, 'relevance' => Relevance::Primary]);
    QuestionBlockLink::create(['question_id' => $q2->id, 'content_block_id' => $block->id, 'relevance' => Relevance::Secondary]);

    expect($block->questionBlockLinks)->toHaveCount(2);
});

test('assessment type has many question papers', function () {
    $assessmentType = AssessmentType::factory()->create();
    QuestionPaper::factory()->forAssessmentType()->create(['assessment_type_id' => $assessmentType->id]);
    QuestionPaper::factory()->forAssessmentType()->create(['assessment_type_id' => $assessmentType->id]);

    expect($assessmentType->questionPapers)->toHaveCount(2);
});

test('assessment type has many question assessment links', function () {
    $assessmentType = AssessmentType::factory()->create();
    $q1 = Question::factory()->create();
    $q2 = Question::factory()->create();

    QuestionAssessmentLink::create(['question_id' => $q1->id, 'assessment_type_id' => $assessmentType->id, 'year' => 2023]);
    QuestionAssessmentLink::create(['question_id' => $q2->id, 'assessment_type_id' => $assessmentType->id, 'year' => 2024]);

    expect($assessmentType->questionAssessmentLinks)->toHaveCount(2);
});

test('institution course has many question papers', function () {
    $course = InstitutionCourse::factory()->create();
    QuestionPaper::factory()->create(['institution_course_id' => $course->id]);
    QuestionPaper::factory()->create(['institution_course_id' => $course->id]);

    expect($course->questionPapers)->toHaveCount(2);
});

test('expanded question type enum has 16 cases', function () {
    expect(QuestionType::cases())->toHaveCount(16)
        ->and(QuestionType::Mcq->value)->toBe('mcq')
        ->and(QuestionType::MultiSelectMcq->value)->toBe('multi_select_mcq')
        ->and(QuestionType::Essay->value)->toBe('essay')
        ->and(QuestionType::TrueFalse->value)->toBe('true_false')
        ->and(QuestionType::DiagramLabel->value)->toBe('diagram_label')
        ->and(QuestionType::Group->value)->toBe('group');
});

test('context type enum has 9 cases', function () {
    expect(ContextType::cases())->toHaveCount(9)
        ->and(ContextType::Passage->value)->toBe('passage')
        ->and(ContextType::CaseStudy->value)->toBe('case_study')
        ->and(ContextType::CodeSnippet->value)->toBe('code_snippet');
});

test('relevance enum has 3 cases', function () {
    expect(Relevance::cases())->toHaveCount(3)
        ->and(Relevance::Primary->value)->toBe('primary')
        ->and(Relevance::Secondary->value)->toBe('secondary')
        ->and(Relevance::Prerequisite->value)->toBe('prerequisite');
});

test('question difficulty enum unchanged', function () {
    expect(QuestionDifficulty::cases())->toHaveCount(3)
        ->and(QuestionDifficulty::Easy->value)->toBe('easy')
        ->and(QuestionDifficulty::Medium->value)->toBe('medium')
        ->and(QuestionDifficulty::Hard->value)->toBe('hard');
});

test('cascade delete removes questions when paper is deleted', function () {
    $paper = QuestionPaper::factory()->create();
    Question::factory()->forPaper()->create(['question_paper_id' => $paper->id]);
    Question::factory()->forPaper()->create(['question_paper_id' => $paper->id]);

    expect(Question::where('question_paper_id', $paper->id)->count())->toBe(2);

    $paper->delete();

    expect(Question::where('question_paper_id', $paper->id)->count())->toBe(0);
});
