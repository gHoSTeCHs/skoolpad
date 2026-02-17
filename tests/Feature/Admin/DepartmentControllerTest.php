<?php

use App\Models\Department;
use App\Models\Faculty;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->faculty = Faculty::factory()->create();
});

test('index displays departments page scoped to faculty', function () {
    Department::factory()->for($this->faculty)->create(['name' => 'Computer Science']);
    Department::factory()->for($this->faculty)->create(['name' => 'Mechanical Engineering']);
    Department::factory()->for($this->faculty)->create(['name' => 'Civil Engineering']);
    Department::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.departments.index', $this->faculty))
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
            ->has('faculty')
        );
});

test('index filters departments by search', function () {
    Department::factory()->for($this->faculty)->create(['name' => 'Computer Science']);
    Department::factory()->for($this->faculty)->create(['name' => 'Mechanical Engineering']);

    $this->actingAs($this->admin)
        ->get(route('admin.departments.index', [$this->faculty, 'search' => 'Computer']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('departments.data', 1)
        );
});

test('create displays create department page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.departments.create', $this->faculty))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/departments/create')
            ->has('faculty')
        );
});

test('store creates a department and redirects', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.departments.store', $this->faculty), [
            'name' => 'Computer Science',
            'abbreviation' => 'CSC',
        ])
        ->assertRedirect(route('admin.departments.index', $this->faculty));

    $this->assertDatabaseHas('departments', [
        'faculty_id' => $this->faculty->id,
        'name' => 'Computer Science',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.departments.store', $this->faculty), [])
        ->assertSessionHasErrors(['name']);
});

test('store validates unique name per faculty', function () {
    Department::factory()->for($this->faculty)->create(['name' => 'Computer Science']);

    $this->actingAs($this->admin)
        ->post(route('admin.departments.store', $this->faculty), [
            'name' => 'Computer Science',
        ])
        ->assertSessionHasErrors(['name']);
});

test('edit displays edit department page', function () {
    $department = Department::factory()->for($this->faculty)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.departments.edit', $department))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/departments/edit')
            ->has('department')
        );
});

test('update modifies a department and redirects', function () {
    $department = Department::factory()->for($this->faculty)->create();

    $this->actingAs($this->admin)
        ->put(route('admin.departments.update', $department), [
            'name' => 'Updated Department',
            'abbreviation' => 'UPD',
        ])
        ->assertRedirect(route('admin.departments.index', $this->faculty));

    $this->assertDatabaseHas('departments', [
        'id' => $department->id,
        'name' => 'Updated Department',
    ]);
});

test('update allows keeping the same name for the same department', function () {
    $department = Department::factory()->for($this->faculty)->create(['name' => 'Computer Science']);

    $this->actingAs($this->admin)
        ->put(route('admin.departments.update', $department), [
            'name' => 'Computer Science',
        ])
        ->assertRedirect(route('admin.departments.index', $this->faculty));
});

test('guests cannot access department routes', function () {
    $faculty = Faculty::factory()->create();
    $this->get(route('admin.departments.index', $faculty))->assertRedirect(route('login'));
    $this->get(route('admin.departments.create', $faculty))->assertRedirect(route('login'));
});
