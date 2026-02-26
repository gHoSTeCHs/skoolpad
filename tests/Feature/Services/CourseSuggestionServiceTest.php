<?php

use App\Enums\CourseScope;
use App\Enums\Semester;
use App\Models\CourseDepartmentOffering;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Services\CourseSuggestionService;

beforeEach(function () {
    $this->service = new CourseSuggestionService;

    $this->institution = Institution::factory()->create();
    $this->faculty = Faculty::factory()->for($this->institution)->create();
    $this->department = Department::factory()->for($this->faculty)->create();
});

test('includes department-scope courses owned by the department', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
        'level' => 200,
        'course_scope' => CourseScope::Department,
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        200,
    );

    expect($results)->toHaveCount(1)
        ->and($results->first()->id)->toBe($course->id);
});

test('includes faculty-scope courses with a department offering', function () {
    $otherDept = Department::factory()->for($this->faculty)->create();

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $otherDept->id,
        'level' => 100,
        'course_scope' => CourseScope::Faculty,
    ]);

    CourseDepartmentOffering::factory()->create([
        'institution_course_id' => $course->id,
        'department_id' => $this->department->id,
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        100,
    );

    expect($results)->toHaveCount(1)
        ->and($results->first()->id)->toBe($course->id);
});

test('includes institution-wide courses', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'level' => 300,
        'course_scope' => CourseScope::InstitutionWide,
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        300,
    );

    expect($results)->toHaveCount(1)
        ->and($results->first()->id)->toBe($course->id);
});

test('excludes courses from a different institution', function () {
    $otherInstitution = Institution::factory()->create();

    InstitutionCourse::factory()->create([
        'institution_id' => $otherInstitution->id,
        'owning_department_id' => $this->department->id,
        'level' => 200,
        'course_scope' => CourseScope::Department,
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        200,
    );

    expect($results)->toBeEmpty();
});

test('excludes courses at a different level', function () {
    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
        'level' => 400,
        'course_scope' => CourseScope::Department,
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        200,
    );

    expect($results)->toBeEmpty();
});

test('excludes department-scope courses owned by a different department', function () {
    $otherDept = Department::factory()->for($this->faculty)->create();

    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $otherDept->id,
        'level' => 200,
        'course_scope' => CourseScope::Department,
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        200,
    );

    expect($results)->toBeEmpty();
});

test('excludes faculty-scope courses without a department offering', function () {
    $otherDept = Department::factory()->for($this->faculty)->create();

    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $otherDept->id,
        'level' => 100,
        'course_scope' => CourseScope::Faculty,
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        100,
    );

    expect($results)->toBeEmpty();
});

test('filters by semester when provided', function () {
    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
        'level' => 200,
        'semester' => Semester::First,
        'course_scope' => CourseScope::Department,
        'course_code' => 'SEM 201',
    ]);

    $secondSemCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
        'level' => 200,
        'semester' => Semester::Second,
        'course_scope' => CourseScope::Department,
        'course_code' => 'SEM 202',
    ]);

    $bothCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
        'level' => 200,
        'semester' => Semester::Both,
        'course_scope' => CourseScope::Department,
        'course_code' => 'SEM 203',
    ]);

    $results = $this->service->getCoursesForStudent(
        $this->institution->id,
        $this->department->id,
        200,
        'second',
    );

    expect($results)->toHaveCount(2)
        ->and($results->pluck('id')->toArray())->toContain($secondSemCourse->id, $bothCourse->id);
});
