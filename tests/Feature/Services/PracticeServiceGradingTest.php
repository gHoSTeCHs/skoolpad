<?php

use App\Enums\QuestionType;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Services\PracticeService;

beforeEach(function () {
    $this->service = app(PracticeService::class);
    $this->course = InstitutionCourse::factory()->create();
});

// ── multi_select_mcq ──────────────────────────────────────────────────────────

it('grades multi_select_mcq as correct on exact match', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::MultiSelectMcq,
        'is_published' => true,
        'response_config' => [
            'options' => [
                ['label' => 'A', 'text' => 'Option A', 'is_correct' => true],
                ['label' => 'B', 'text' => 'Option B', 'is_correct' => false],
                ['label' => 'C', 'text' => 'Option C', 'is_correct' => true],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['selected_labels' => ['A', 'C']]))->toBeTrue();
    expect($this->service->gradeAnswer($question, ['selected_labels' => ['C', 'A']]))->toBeTrue();
});

it('grades multi_select_mcq as incorrect on partial selection', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::MultiSelectMcq,
        'is_published' => true,
        'response_config' => [
            'options' => [
                ['label' => 'A', 'text' => 'Option A', 'is_correct' => true],
                ['label' => 'B', 'text' => 'Option B', 'is_correct' => false],
                ['label' => 'C', 'text' => 'Option C', 'is_correct' => true],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['selected_labels' => ['A']]))->toBeFalse();
    expect($this->service->gradeAnswer($question, ['selected_labels' => ['A', 'B', 'C']]))->toBeFalse();
});

// ── true_false ────────────────────────────────────────────────────────────────

it('grades true_false correctly', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::TrueFalse,
        'is_published' => true,
        'response_config' => ['correct_answer' => true, 'requires_justification' => false],
    ]);

    expect($this->service->gradeAnswer($question, ['answer' => true]))->toBeTrue();
    expect($this->service->gradeAnswer($question, ['answer' => false]))->toBeFalse();
});

// ── numeric_entry ─────────────────────────────────────────────────────────────

it('grades numeric_entry exactly when no tolerance', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::NumericEntry,
        'is_published' => true,
        'response_config' => ['answer' => 42, 'unit' => 'm/s'],
    ]);

    expect($this->service->gradeAnswer($question, ['value' => 42]))->toBeTrue();
    expect($this->service->gradeAnswer($question, ['value' => 43]))->toBeFalse();
});

it('grades numeric_entry within tolerance as correct', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::NumericEntry,
        'is_published' => true,
        'response_config' => ['answer' => 9.8, 'tolerance' => 0.1],
    ]);

    expect($this->service->gradeAnswer($question, ['value' => 9.85]))->toBeTrue();
    expect($this->service->gradeAnswer($question, ['value' => 9.91]))->toBeFalse();
});

// ── assertion_reason ──────────────────────────────────────────────────────────

it('grades assertion_reason by label match', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::AssertionReason,
        'is_published' => true,
        'response_config' => [
            'assertion' => 'Water boils at 100°C',
            'reason' => 'Because of atmospheric pressure',
            'options' => [
                ['label' => 'A', 'text' => 'Both true, reason correct', 'is_correct' => true],
                ['label' => 'B', 'text' => 'Both true, reason incorrect', 'is_correct' => false],
                ['label' => 'C', 'text' => 'Assertion true, reason false', 'is_correct' => false],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['selected' => 'A']))->toBeTrue();
    expect($this->service->gradeAnswer($question, ['selected' => 'B']))->toBeFalse();
});

// ── non-gradable types return null ─────────────────────────────────────────

it('returns null for non-gradable types', function () {
    foreach ([QuestionType::Theory, QuestionType::Essay, QuestionType::ShortAnswer, QuestionType::Calculation] as $type) {
        $question = Question::factory()->create([
            'institution_course_id' => $this->course->id,
            'question_type' => $type,
            'is_published' => true,
        ]);

        expect($this->service->gradeAnswer($question, ['text' => 'Some answer']))->toBeNull();
    }
});
