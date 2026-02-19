<?php

use App\Models\Department;
use App\Models\Discipline;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->actingAs($this->admin);
});

test('index lists courses with pagination', function () {
    InstitutionCourse::factory()->count(3)->create();

    $this->get(route('admin.courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/index')
            ->has('courses.data', 3)
            ->has('courses.meta.current_page')
            ->has('courses.meta.last_page')
            ->has('courses.meta.per_page')
            ->has('courses.meta.total')
            ->has('courses.links.prev')
            ->has('courses.links.next')
            ->has('institutions')
        );
});

test('index filters courses by institution', function () {
    $institution = Institution::factory()->create();
    $otherInstitution = Institution::factory()->create();
    InstitutionCourse::factory()->count(3)->create(['institution_id' => $institution->id]);
    InstitutionCourse::factory()->count(2)->create(['institution_id' => $otherInstitution->id]);

    $this->get(route('admin.courses.index', ['institution_id' => $institution->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('courses.data', 3));
});

test('create displays create course page', function () {
    $this->get(route('admin.courses.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/create')
            ->has('institutions')
            ->has('disciplines')
            ->has('levels')
            ->has('course_scopes')
            ->has('semesters')
        );
});

test('store creates a course with valid data and owning_department_id', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    $discipline = Discipline::factory()->create();

    $this->post(route('admin.courses.store'), [
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'discipline_id' => $discipline->id,
        'course_code' => 'CSC 201',
        'course_title' => 'Data Structures',
        'level' => 200,
        'semester' => 'first',
        'credit_units' => 3,
        'is_elective' => false,
        'course_scope' => 'department',
    ])->assertRedirect();

    $this->assertDatabaseHas('institution_courses', [
        'owning_department_id' => $dept->id,
        'institution_id' => $institution->id,
        'course_code' => 'CSC 201',
    ]);
});

test('store validates required fields', function () {
    $this->post(route('admin.courses.store'), [])
        ->assertSessionHasErrors(['institution_id', 'owning_department_id', 'discipline_id', 'course_code', 'course_title', 'level', 'semester', 'course_scope']);
});

test('store enforces course_code uniqueness per institution', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    $discipline = Discipline::factory()->create();

    InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'course_code' => 'CSC 201',
    ]);

    $this->post(route('admin.courses.store'), [
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'discipline_id' => $discipline->id,
        'course_code' => 'CSC 201',
        'course_title' => 'Duplicate Course',
        'level' => 200,
        'semester' => 'first',
        'credit_units' => 3,
        'course_scope' => 'department',
    ])->assertSessionHasErrors('course_code');
});

test('store allows same course_code at different institution', function () {
    $institution1 = Institution::factory()->create();
    $institution2 = Institution::factory()->create();
    $faculty2 = Faculty::factory()->create(['institution_id' => $institution2->id]);
    $dept2 = Department::factory()->create(['faculty_id' => $faculty2->id]);
    $discipline = Discipline::factory()->create();

    InstitutionCourse::factory()->create([
        'institution_id' => $institution1->id,
        'course_code' => 'CSC 201',
    ]);

    $this->post(route('admin.courses.store'), [
        'institution_id' => $institution2->id,
        'owning_department_id' => $dept2->id,
        'discipline_id' => $discipline->id,
        'course_code' => 'CSC 201',
        'course_title' => 'Data Structures',
        'level' => 200,
        'semester' => 'first',
        'credit_units' => 3,
        'course_scope' => 'department',
    ])->assertRedirect();

    $this->assertDatabaseCount('institution_courses', 2);
});

test('store rejects owning_department_id from a different institution', function () {
    $institution = Institution::factory()->create();
    $otherInstitution = Institution::factory()->create();
    $otherFaculty = Faculty::factory()->create(['institution_id' => $otherInstitution->id]);
    $otherDept = Department::factory()->create(['faculty_id' => $otherFaculty->id]);
    $discipline = Discipline::factory()->create();

    $this->post(route('admin.courses.store'), [
        'institution_id' => $institution->id,
        'owning_department_id' => $otherDept->id,
        'discipline_id' => $discipline->id,
        'course_code' => 'CSC 201',
        'course_title' => 'Data Structures',
        'level' => 200,
        'semester' => 'first',
        'credit_units' => 3,
        'course_scope' => 'department',
    ])->assertSessionHasErrors('owning_department_id');
});

test('institution structure api returns faculties and departments', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    Department::factory()->count(3)->create(['faculty_id' => $faculty->id]);

    $this->getJson(route('admin.api.institution.structure', $institution))
        ->assertOk()
        ->assertJsonCount(1, 'faculties')
        ->assertJsonCount(3, 'departments');
});

test('edit displays edit course page', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
    ]);

    $this->get(route('admin.courses.edit', $course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/courses/edit')
            ->has('course')
            ->where('course.id', $course->id)
            ->has('institutions')
            ->has('disciplines')
            ->has('course_scopes')
            ->has('semesters')
        );
});

test('update modifies a course correctly', function () {
    $institution = Institution::factory()->create();
    $faculty = Faculty::factory()->create(['institution_id' => $institution->id]);
    $dept = Department::factory()->create(['faculty_id' => $faculty->id]);
    $discipline = Discipline::factory()->create();

    $course = InstitutionCourse::factory()->create([
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'discipline_id' => $discipline->id,
    ]);

    $this->put(route('admin.courses.update', $course), [
        'institution_id' => $institution->id,
        'owning_department_id' => $dept->id,
        'discipline_id' => $discipline->id,
        'course_code' => 'CSC 301',
        'course_title' => 'Updated Title',
        'level' => 300,
        'semester' => 'second',
        'credit_units' => 4,
        'is_elective' => true,
        'course_scope' => 'department',
    ])->assertRedirect();

    $this->assertDatabaseHas('institution_courses', [
        'id' => $course->id,
        'course_code' => 'CSC 301',
        'course_title' => 'Updated Title',
    ]);
});

test('guests cannot access course routes', function () {
    auth()->logout();

    $this->get(route('admin.courses.index'))->assertRedirect(route('login'));
    $this->get(route('admin.courses.create'))->assertRedirect(route('login'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.courses.index'))
        ->assertForbidden();
});
