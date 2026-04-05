<?php

use App\Enums\ScaleType;
use App\Models\GradingScale;
use App\Services\Student\CgpaSimulatorService;

beforeEach(function () {
    $this->service = new CgpaSimulatorService;

    $this->universityScale = new GradingScale([
        'name' => 'Nigerian University CGPA (5-point)',
        'scale_type' => ScaleType::Cgpa,
        'scale_min' => 0,
        'scale_max' => 5,
        'pass_threshold' => 1,
        'grade_boundaries' => [
            ['label' => 'A', 'min' => 70, 'max' => 100, 'gp' => 5, 'is_pass' => true],
            ['label' => 'B', 'min' => 60, 'max' => 69, 'gp' => 4, 'is_pass' => true],
            ['label' => 'C', 'min' => 50, 'max' => 59, 'gp' => 3, 'is_pass' => true],
            ['label' => 'D', 'min' => 45, 'max' => 49, 'gp' => 2, 'is_pass' => true],
            ['label' => 'E', 'min' => 40, 'max' => 44, 'gp' => 1, 'is_pass' => true],
            ['label' => 'F', 'min' => 0, 'max' => 39, 'gp' => 0, 'is_pass' => false],
        ],
        'classification_labels' => [
            ['label' => 'First Class', 'min_cgpa' => 4.5],
            ['label' => 'Second Class Upper', 'min_cgpa' => 3.5],
            ['label' => 'Second Class Lower', 'min_cgpa' => 2.4],
            ['label' => 'Third Class', 'min_cgpa' => 1.5],
            ['label' => 'Pass', 'min_cgpa' => 1.0],
        ],
    ]);

    $this->polytechnicScale = new GradingScale([
        'name' => 'Nigerian Polytechnic CGPA (4-point)',
        'scale_type' => ScaleType::Cgpa,
        'scale_min' => 0,
        'scale_max' => 4,
        'pass_threshold' => 1,
        'grade_boundaries' => [
            ['label' => 'A', 'min' => 70, 'max' => 100, 'gp' => 4, 'is_pass' => true],
            ['label' => 'AB', 'min' => 60, 'max' => 69, 'gp' => 3.5, 'is_pass' => true],
            ['label' => 'B', 'min' => 50, 'max' => 59, 'gp' => 3, 'is_pass' => true],
            ['label' => 'BC', 'min' => 45, 'max' => 49, 'gp' => 2.5, 'is_pass' => true],
            ['label' => 'C', 'min' => 40, 'max' => 44, 'gp' => 2, 'is_pass' => true],
            ['label' => 'CD', 'min' => 35, 'max' => 39, 'gp' => 1.5, 'is_pass' => true],
            ['label' => 'D', 'min' => 30, 'max' => 34, 'gp' => 1, 'is_pass' => true],
            ['label' => 'F', 'min' => 0, 'max' => 29, 'gp' => 0, 'is_pass' => false],
        ],
        'classification_labels' => [
            ['label' => 'Distinction', 'min_cgpa' => 3.5],
            ['label' => 'Upper Credit', 'min_cgpa' => 3.0],
            ['label' => 'Lower Credit', 'min_cgpa' => 2.5],
            ['label' => 'Pass', 'min_cgpa' => 1.0],
        ],
    ]);
});

it('converts grade to point for university scale', function () {
    expect($this->service->gradeToPoint('A', $this->universityScale))->toBe(5.0);
    expect($this->service->gradeToPoint('B', $this->universityScale))->toBe(4.0);
    expect($this->service->gradeToPoint('C', $this->universityScale))->toBe(3.0);
    expect($this->service->gradeToPoint('D', $this->universityScale))->toBe(2.0);
    expect($this->service->gradeToPoint('E', $this->universityScale))->toBe(1.0);
    expect($this->service->gradeToPoint('F', $this->universityScale))->toBe(0.0);
});

it('converts grade to point for polytechnic scale', function () {
    expect($this->service->gradeToPoint('A', $this->polytechnicScale))->toBe(4.0);
    expect($this->service->gradeToPoint('AB', $this->polytechnicScale))->toBe(3.5);
    expect($this->service->gradeToPoint('B', $this->polytechnicScale))->toBe(3.0);
    expect($this->service->gradeToPoint('F', $this->polytechnicScale))->toBe(0.0);
});

it('returns null for invalid grade', function () {
    expect($this->service->gradeToPoint('Z', $this->universityScale))->toBeNull();
    expect($this->service->gradeToPoint('', $this->universityScale))->toBeNull();
});

it('performs case-insensitive grade lookup', function () {
    expect($this->service->gradeToPoint('a', $this->universityScale))->toBe(5.0);
    expect($this->service->gradeToPoint('ab', $this->polytechnicScale))->toBe(3.5);
});

it('calculates GPA with known inputs for university scale', function () {
    $courses = [
        ['credit_units' => 3, 'grade' => 'A'],
        ['credit_units' => 3, 'grade' => 'B'],
        ['credit_units' => 3, 'grade' => 'C'],
    ];

    $result = $this->service->calculateGpa($courses, $this->universityScale);

    expect($result)
        ->gpa->toBe(4.0)
        ->total_credits->toBe(9)
        ->total_quality_points->toBe(36.0);
});

it('calculates GPA with mixed credits for university scale', function () {
    $courses = [
        ['credit_units' => 3, 'grade' => 'A'],
        ['credit_units' => 3, 'grade' => 'B'],
    ];

    $result = $this->service->calculateGpa($courses, $this->universityScale);

    expect($result)
        ->gpa->toBe(4.5)
        ->total_credits->toBe(6)
        ->total_quality_points->toBe(27.0);
});

it('calculates GPA for polytechnic scale', function () {
    $courses = [
        ['credit_units' => 3, 'grade' => 'A'],
        ['credit_units' => 3, 'grade' => 'AB'],
    ];

    $result = $this->service->calculateGpa($courses, $this->polytechnicScale);

    expect($result)
        ->gpa->toBe(3.75)
        ->total_credits->toBe(6)
        ->total_quality_points->toBe(22.5);
});

it('returns zero GPA for empty courses', function () {
    $result = $this->service->calculateGpa([], $this->universityScale);

    expect($result)
        ->gpa->toBe(0.0)
        ->total_credits->toBe(0)
        ->total_quality_points->toBe(0.0);
});

it('skips courses with invalid grades in GPA calculation', function () {
    $courses = [
        ['credit_units' => 3, 'grade' => 'A'],
        ['credit_units' => 3, 'grade' => 'INVALID'],
    ];

    $result = $this->service->calculateGpa($courses, $this->universityScale);

    expect($result)
        ->gpa->toBe(5.0)
        ->total_credits->toBe(3);
});

it('calculates projected CGPA correctly', function () {
    $projected = [
        ['credit_units' => 3, 'grade' => 'A'],
        ['credit_units' => 3, 'grade' => 'A'],
    ];

    $result = $this->service->calculateProjectedCgpa(
        currentCgpa: 3.50,
        currentCredits: 60,
        projectedCourses: $projected,
        scale: $this->universityScale,
    );

    $expected = round((3.50 * 60 + 30) / 66, 2);

    expect($result)
        ->projected_cgpa->toBe($expected)
        ->classification->toBe('Second Class Upper')
        ->new_credits->toBe(6)
        ->new_quality_points->toBe(30.0);
});

it('calculates projected CGPA from zero', function () {
    $projected = [
        ['credit_units' => 3, 'grade' => 'A'],
        ['credit_units' => 3, 'grade' => 'B'],
    ];

    $result = $this->service->calculateProjectedCgpa(
        currentCgpa: 0.0,
        currentCredits: 0,
        projectedCourses: $projected,
        scale: $this->universityScale,
    );

    expect($result)
        ->projected_cgpa->toBe(4.5)
        ->classification->toBe('First Class');
});

it('classifies CGPA for university scale', function () {
    expect($this->service->classifyCgpa(4.8, $this->universityScale))->toBe('First Class');
    expect($this->service->classifyCgpa(4.5, $this->universityScale))->toBe('First Class');
    expect($this->service->classifyCgpa(3.8, $this->universityScale))->toBe('Second Class Upper');
    expect($this->service->classifyCgpa(3.5, $this->universityScale))->toBe('Second Class Upper');
    expect($this->service->classifyCgpa(2.5, $this->universityScale))->toBe('Second Class Lower');
    expect($this->service->classifyCgpa(2.4, $this->universityScale))->toBe('Second Class Lower');
    expect($this->service->classifyCgpa(1.8, $this->universityScale))->toBe('Third Class');
    expect($this->service->classifyCgpa(1.0, $this->universityScale))->toBe('Pass');
    expect($this->service->classifyCgpa(0.5, $this->universityScale))->toBeNull();
});

it('classifies CGPA for polytechnic scale', function () {
    expect($this->service->classifyCgpa(3.8, $this->polytechnicScale))->toBe('Distinction');
    expect($this->service->classifyCgpa(3.2, $this->polytechnicScale))->toBe('Upper Credit');
    expect($this->service->classifyCgpa(2.7, $this->polytechnicScale))->toBe('Lower Credit');
    expect($this->service->classifyCgpa(1.5, $this->polytechnicScale))->toBe('Pass');
});

it('calculates required GPA for achievable target', function () {
    $result = $this->service->calculateRequiredGpa(
        currentCgpa: 3.0,
        currentCredits: 60,
        targetCgpa: 3.5,
        remainingCredits: 30,
        scale: $this->universityScale,
    );

    $expected = round((3.5 * 90 - 3.0 * 60) / 30, 2);

    expect($result)
        ->required_gpa->toBe($expected)
        ->is_achievable->toBeTrue()
        ->minimum_grade->not->toBeNull()
        ->message->toContain('minimum GPA of');
});

it('detects unachievable target in reverse calculator', function () {
    $result = $this->service->calculateRequiredGpa(
        currentCgpa: 1.0,
        currentCredits: 100,
        targetCgpa: 4.5,
        remainingCredits: 10,
        scale: $this->universityScale,
    );

    expect($result)
        ->is_achievable->toBeFalse()
        ->message->toContain('exceeds the maximum');
});

it('handles already-exceeded target in reverse calculator', function () {
    $result = $this->service->calculateRequiredGpa(
        currentCgpa: 4.5,
        currentCredits: 120,
        targetCgpa: 3.0,
        remainingCredits: 30,
        scale: $this->universityScale,
    );

    expect($result)
        ->is_achievable->toBeTrue()
        ->message->toContain('exceeded your target');
});

it('handles zero remaining credits in reverse calculator', function () {
    $result = $this->service->calculateRequiredGpa(
        currentCgpa: 3.5,
        currentCredits: 120,
        targetCgpa: 4.0,
        remainingCredits: 0,
        scale: $this->universityScale,
    );

    expect($result)
        ->required_gpa->toBe(0.0)
        ->is_achievable->toBeFalse()
        ->message->toContain('No remaining credits');
});

it('identifies minimum grade needed for target', function () {
    $result = $this->service->calculateRequiredGpa(
        currentCgpa: 3.0,
        currentCredits: 60,
        targetCgpa: 3.5,
        remainingCredits: 60,
        scale: $this->universityScale,
    );

    expect($result)
        ->minimum_grade->not->toBeNull()
        ->is_achievable->toBeTrue();
});
