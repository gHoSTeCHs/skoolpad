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

// ── cloze ─────────────────────────────────────────────────────────────────────

it('grades cloze as correct when all gaps match', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Cloze,
        'is_published' => true,
        'response_config' => [
            'gaps' => [
                ['position' => 0, 'options' => ['apple', 'banana', 'cherry'], 'correct' => 1],
                ['position' => 1, 'options' => ['cat', 'dog', 'fish'], 'correct' => 2],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['gaps' => ['0' => 1, '1' => 2]]))->toBeTrue();
});

it('grades cloze as incorrect when any gap is wrong', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Cloze,
        'is_published' => true,
        'response_config' => [
            'gaps' => [
                ['position' => 0, 'options' => ['apple', 'banana', 'cherry'], 'correct' => 1],
                ['position' => 1, 'options' => ['cat', 'dog', 'fish'], 'correct' => 2],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['gaps' => ['0' => 0, '1' => 2]]))->toBeFalse();
});

// ── matching ──────────────────────────────────────────────────────────────────

it('grades matching as correct when all pairs are correct', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Matching,
        'is_published' => true,
        'response_config' => [
            'pairs' => ['0' => 1, '1' => 0, '2' => 2],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['pairs' => ['0' => 1, '1' => 0, '2' => 2]]))->toBeTrue();
});

it('grades matching as incorrect when pairs are wrong', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Matching,
        'is_published' => true,
        'response_config' => [
            'pairs' => ['0' => 1, '1' => 0, '2' => 2],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['pairs' => ['0' => 0, '1' => 1, '2' => 2]]))->toBeFalse();
});

// ── ordering ──────────────────────────────────────────────────────────────────

it('grades ordering as correct when sequence matches', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Ordering,
        'is_published' => true,
        'response_config' => [
            'correct_order' => [2, 0, 1, 3],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['order' => [2, 0, 1, 3]]))->toBeTrue();
});

it('grades ordering as incorrect when sequence does not match', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Ordering,
        'is_published' => true,
        'response_config' => [
            'correct_order' => [2, 0, 1, 3],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['order' => [0, 1, 2, 3]]))->toBeFalse();
});

// ── fill_blank ────────────────────────────────────────────────────────────────

it('grades fill_blank as correct when all blanks match case-insensitively', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::FillBlank,
        'is_published' => true,
        'response_config' => [
            'blanks' => [
                ['position' => 0, 'correct_answers' => ['Paris', 'paris']],
                ['position' => 1, 'correct_answers' => ['France']],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['blanks' => ['0' => 'Paris', '1' => 'france']]))->toBeTrue();
});

it('grades fill_blank as incorrect when blanks are wrong', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::FillBlank,
        'is_published' => true,
        'response_config' => [
            'blanks' => [
                ['position' => 0, 'correct_answers' => ['Paris', 'paris']],
                ['position' => 1, 'correct_answers' => ['France']],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['blanks' => ['0' => 'London', '1' => 'Germany']]))->toBeFalse();
});

// ── diagram_label ─────────────────────────────────────────────────────────────

it('grades diagram_label as correct when all labels match case-insensitively', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::DiagramLabel,
        'is_published' => true,
        'response_config' => [
            'labels' => [
                ['answer' => 'Nucleus'],
                ['answer' => 'Mitochondria'],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['labels' => ['hotspot_0' => 'nucleus', 'hotspot_1' => 'MITOCHONDRIA']]))->toBeTrue();
});

it('grades diagram_label as incorrect when labels are wrong', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::DiagramLabel,
        'is_published' => true,
        'response_config' => [
            'labels' => [
                ['answer' => 'Nucleus'],
                ['answer' => 'Mitochondria'],
            ],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['labels' => ['hotspot_0' => 'Cell Wall', 'hotspot_1' => 'Mitochondria']]))->toBeFalse();
});

// ── matrix_matching ───────────────────────────────────────────────────────────

it('grades matrix_matching as correct when all rows match order-agnostically', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::MatrixMatching,
        'is_published' => true,
        'response_config' => [
            'mapping' => ['0' => [0, 2], '1' => [1]],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['matches' => ['0' => [2, 0], '1' => [1]]]))->toBeTrue();
});

it('grades matrix_matching as incorrect when a row is missing an index', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::MatrixMatching,
        'is_published' => true,
        'response_config' => [
            'mapping' => ['0' => [0, 2], '1' => [1]],
        ],
    ]);

    expect($this->service->gradeAnswer($question, ['matches' => ['0' => [0], '1' => [1]]]))->toBeFalse();
});
