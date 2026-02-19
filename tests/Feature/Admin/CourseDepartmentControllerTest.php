<?php

use App\Enums\CourseScope;
use App\Models\CourseDepartmentOffering;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->actingAs($this->admin);
});

test('index returns scope_type department for department-scoped courses', function () {
    $course = InstitutionCourse::factory()->create(['course_scope' => CourseScope::Department]);

    $this->get(route('admin.courses.departments', $course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/departments')
            ->where('scope_type', 'department')
            ->has('message')
        );
});

test('index returns scope_type institution_wide for institution-wide courses', function () {
    $course = InstitutionCourse::factory()->create(['course_scope' => CourseScope::InstitutionWide]);

    $this->get(route('admin.courses.departments', $course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('scope_type', 'institution_wide')
            ->has('message')
        );
});

test('index returns faculty checklist for faculty-scoped courses', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept1 = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Computer Science', 'abbreviation' => 'CSC']);
    $dept2 = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Mathematics', 'abbreviation' => 'MTH']);
    $owningDept = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Physics', 'abbreviation' => 'PHY']);

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $owningDept->id,
        'course_scope' => CourseScope::Faculty,
    ]);

    CourseDepartmentOffering::factory()->create([
        'institution_course_id' => $course->id,
        'department_id' => $dept1->id,
        'is_compulsory' => true,
    ]);

    $this->get(route('admin.courses.departments', $course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('scope_type', 'faculty')
            ->has('faculties', 1)
            ->has('faculties.0.departments', 3)
        );
});

test('update saves batch offerings for faculty-scoped course', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept1 = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Computer Science', 'abbreviation' => 'CSC']);
    $dept2 = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Mathematics', 'abbreviation' => 'MTH']);
    $owningDept = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Physics', 'abbreviation' => 'PHY']);

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $owningDept->id,
        'course_scope' => CourseScope::Faculty,
    ]);

    $this->put(route('admin.courses.departments.update', $course), [
        'offerings' => [
            ['department_id' => $dept1->id, 'is_compulsory' => true],
            ['department_id' => $dept2->id, 'is_compulsory' => false],
        ],
    ])->assertRedirect();

    $this->assertDatabaseHas('course_department_offerings', [
        'institution_course_id' => $course->id,
        'department_id' => $dept1->id,
        'is_compulsory' => true,
    ]);
    $this->assertDatabaseHas('course_department_offerings', [
        'institution_course_id' => $course->id,
        'department_id' => $dept2->id,
        'is_compulsory' => false,
    ]);
});

test('update deletes removed offerings on save', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept1 = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Computer Science', 'abbreviation' => 'CSC']);
    $dept2 = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Mathematics', 'abbreviation' => 'MTH']);
    $dept3 = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Physics', 'abbreviation' => 'PHY']);
    $owningDept = Department::factory()->create(['faculty_id' => $faculty->id, 'name' => 'Chemistry', 'abbreviation' => 'CHM']);

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $owningDept->id,
        'course_scope' => CourseScope::Faculty,
    ]);

    CourseDepartmentOffering::factory()->create(['institution_course_id' => $course->id, 'department_id' => $dept1->id]);
    CourseDepartmentOffering::factory()->create(['institution_course_id' => $course->id, 'department_id' => $dept2->id]);
    CourseDepartmentOffering::factory()->create(['institution_course_id' => $course->id, 'department_id' => $dept3->id]);

    $this->put(route('admin.courses.departments.update', $course), [
        'offerings' => [
            ['department_id' => $dept1->id, 'is_compulsory' => true],
        ],
    ])->assertRedirect();

    $this->assertDatabaseCount('course_department_offerings', 1);
    $this->assertDatabaseHas('course_department_offerings', [
        'institution_course_id' => $course->id,
        'department_id' => $dept1->id,
    ]);
});

test('update rejects non-faculty scope on PUT', function () {
    $course = InstitutionCourse::factory()->create(['course_scope' => CourseScope::Department]);

    $this->put(route('admin.courses.departments.update', $course), ['offerings' => []])
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('update rejects cross-institution departments', function () {
    $institution = Institution::factory()->create();
    $otherInstitution = Institution::factory()->create();
    $otherFaculty = Faculty::factory()->create(['institution_id' => $otherInstitution->id]);
    $crossDept = Department::factory()->create(['faculty_id' => $otherFaculty->id]);
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $owningDept = Department::factory()->create(['faculty_id' => $faculty->id]);

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $owningDept->id,
        'course_scope' => CourseScope::Faculty,
    ]);

    $this->put(route('admin.courses.departments.update', $course), [
        'offerings' => [
            ['department_id' => $crossDept->id, 'is_compulsory' => true],
        ],
    ])->assertRedirect();

    $this->assertDatabaseCount('course_department_offerings', 0);
});

test('guests cannot access course department routes', function () {
    auth()->logout();
    $course = InstitutionCourse::factory()->create();

    $this->get(route('admin.courses.departments', $course))->assertRedirect(route('login'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();
    $course = InstitutionCourse::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.courses.departments', $course))
        ->assertForbidden();
});
