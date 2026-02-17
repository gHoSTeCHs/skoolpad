<?php

use App\Models\Department;
use App\Models\Faculty;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays departments page', function () {
    Department::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.departments.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/departments/index')
            ->has('departments.data', 3)
            ->has('departments.meta.current_page')
            ->has('departments.meta.last_page')
            ->has('departments.meta.per_page')
            ->has('departments.meta.total')
            ->has('departments.links.prev')
            ->has('departments.links.next')
            ->has('faculties')
        );
});

test('index filters departments by search', function () {
    Department::factory()->create(['name' => 'Computer Science']);
    Department::factory()->create(['name' => 'Mechanical Engineering']);

    $this->actingAs($this->admin)
        ->get(route('admin.departments.index', ['search' => 'Computer']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('departments.data', 1)
        );
});

test('index filters departments by faculty_id', function () {
    $faculty = Faculty::factory()->create();
    Department::factory()->for($faculty)->create();
    Department::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.departments.index', ['faculty_id' => $faculty->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('departments.data', 1)
        );
});

test('create displays create department page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.departments.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/departments/create')
            ->has('faculties')
        );
});

test('store creates a department and redirects', function () {
    $faculty = Faculty::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.departments.store'), [
            'faculty_id' => $faculty->id,
            'name' => 'Computer Science',
            'abbreviation' => 'CSC',
        ])
        ->assertRedirect(route('admin.departments.index'));

    $this->assertDatabaseHas('departments', [
        'faculty_id' => $faculty->id,
        'name' => 'Computer Science',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.departments.store'), [])
        ->assertSessionHasErrors(['faculty_id', 'name']);
});

test('store validates unique name per faculty', function () {
    $faculty = Faculty::factory()->create();
    Department::factory()->for($faculty)->create(['name' => 'Computer Science']);

    $this->actingAs($this->admin)
        ->post(route('admin.departments.store'), [
            'faculty_id' => $faculty->id,
            'name' => 'Computer Science',
        ])
        ->assertSessionHasErrors(['name']);
});

test('edit displays edit department page', function () {
    $department = Department::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.departments.edit', $department))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/departments/edit')
            ->has('department')
            ->has('faculties')
        );
});

test('update modifies a department and redirects', function () {
    $department = Department::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.departments.update', $department), [
            'faculty_id' => $department->faculty_id,
            'name' => 'Updated Department',
            'abbreviation' => 'UPD',
        ])
        ->assertRedirect(route('admin.departments.index'));

    $this->assertDatabaseHas('departments', [
        'id' => $department->id,
        'name' => 'Updated Department',
    ]);
});

test('update allows keeping the same name for the same department', function () {
    $department = Department::factory()->create(['name' => 'Computer Science']);

    $this->actingAs($this->admin)
        ->put(route('admin.departments.update', $department), [
            'faculty_id' => $department->faculty_id,
            'name' => 'Computer Science',
        ])
        ->assertRedirect(route('admin.departments.index'));
});

test('guests cannot access department routes', function () {
    $this->get(route('admin.departments.index'))->assertRedirect(route('login'));
    $this->get(route('admin.departments.create'))->assertRedirect(route('login'));
});
