<?php

use App\Enums\CourseScope;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->actingAs($this->student);

    $this->institution = Institution::factory()->create();
    $this->faculty = Faculty::factory()->for($this->institution)->create();
    $this->department = Department::factory()->for($this->faculty)->create();
});

test('show renders the onboarding page', function () {
    $this->get(route('onboarding.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('onboarding/index')
            ->has('semester')
            ->has('academic_year')
        );
});

test('show redirects to dashboard if profile already exists', function () {
    StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
    ]);

    $this->get(route('onboarding.index'))
        ->assertRedirect(route('dashboard'));
});

test('store creates student profile and courses', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    $this->post(route('onboarding.store'), [
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
        'level' => 200,
        'matric_number' => 'TEST/22/CS/001',
        'admission_year' => 2022,
        'course_ids' => [$course->id],
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $this->student->id,
        'institution_id' => $this->institution->id,
        'level' => 200,
        'matric_number' => 'TEST/22/CS/001',
    ]);

    $this->assertDatabaseHas('student_courses', [
        'institution_course_id' => $course->id,
    ]);
});

test('store validates required fields', function () {
    $this->post(route('onboarding.store'), [])
        ->assertSessionHasErrors(['institution_id', 'faculty_id', 'department_id', 'level', 'course_ids']);
});

test('store rejects faculty from different institution', function () {
    $otherInstitution = Institution::factory()->create();
    $otherFaculty = Faculty::factory()->for($otherInstitution)->create();

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);

    $this->post(route('onboarding.store'), [
        'institution_id' => $this->institution->id,
        'faculty_id' => $otherFaculty->id,
        'department_id' => $this->department->id,
        'level' => 200,
        'course_ids' => [$course->id],
    ])->assertSessionHasErrors('faculty_id');
});

test('store rejects department from different faculty', function () {
    $otherFaculty = Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Law', 'abbreviation' => 'FLAW']);
    $otherDept = Department::factory()->for($otherFaculty)->create();

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);

    $this->post(route('onboarding.store'), [
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $otherDept->id,
        'level' => 200,
        'course_ids' => [$course->id],
    ])->assertSessionHasErrors('department_id');
});

test('store allows optional matric_number and admission_year', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    $this->post(route('onboarding.store'), [
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
        'level' => 100,
        'course_ids' => [$course->id],
    ])->assertRedirect(route('dashboard'));

    $this->assertDatabaseHas('student_profiles', [
        'user_id' => $this->student->id,
        'matric_number' => null,
        'admission_year' => null,
    ]);
});

test('searchInstitutions returns matching institutions', function () {
    $this->getJson(route('api.onboarding.institutions.search', ['q' => $this->institution->name]))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['abbreviation' => $this->institution->abbreviation]);
});

test('searchInstitutions matches by abbreviation', function () {
    $this->getJson(route('api.onboarding.institutions.search', ['q' => $this->institution->abbreviation]))
        ->assertOk()
        ->assertJsonCount(1);
});

test('faculties returns faculties for institution', function () {
    $this->getJson(route('api.onboarding.faculties', $this->institution))
        ->assertOk()
        ->assertJsonCount(1);
});

test('departments returns departments for faculty', function () {
    $this->getJson(route('api.onboarding.departments', $this->faculty))
        ->assertOk()
        ->assertJsonCount(1);
});

test('courseSuggestions returns appropriate courses', function () {
    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
        'level' => 200,
        'course_scope' => CourseScope::Department,
        'semester' => \App\Enums\Semester::Both,
    ]);

    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'level' => 200,
        'course_scope' => CourseScope::InstitutionWide,
        'course_code' => 'GNS 201',
        'semester' => \App\Enums\Semester::Both,
    ]);

    $this->getJson(route('api.onboarding.course-suggestions', [
        'institution_id' => $this->institution->id,
        'department_id' => $this->department->id,
        'level' => 200,
    ]))
        ->assertOk()
        ->assertJsonCount(2);
});

test('searchCourses returns matching courses', function () {
    InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'course_code' => 'CSC 301',
        'course_title' => 'Operating Systems',
    ]);

    $this->getJson(route('api.onboarding.courses.search', [
        'institution_id' => $this->institution->id,
        'q' => 'CSC',
    ]))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['course_code' => 'CSC 301']);
});

test('guests cannot access onboarding', function () {
    auth()->logout();

    $this->get(route('onboarding.index'))->assertRedirect(route('login'));
});
