<?php

use App\Models\Faculty;
use App\Models\Institution;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays faculties page', function () {
    Faculty::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.faculties.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/faculties/index')
            ->has('faculties.data', 3)
            ->has('faculties.meta.current_page')
            ->has('faculties.meta.last_page')
            ->has('faculties.meta.per_page')
            ->has('faculties.meta.total')
            ->has('faculties.links.prev')
            ->has('faculties.links.next')
            ->has('institutions')
        );
});

test('index filters faculties by search', function () {
    Faculty::factory()->create(['name' => 'Faculty of Engineering']);
    Faculty::factory()->create(['name' => 'Faculty of Arts']);

    $this->actingAs($this->admin)
        ->get(route('admin.faculties.index', ['search' => 'Engineering']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('faculties.data', 1)
        );
});

test('index filters faculties by institution_id', function () {
    $institution = Institution::factory()->create();
    Faculty::factory()->for($institution)->create();
    Faculty::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.faculties.index', ['institution_id' => $institution->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('faculties.data', 1)
        );
});

test('create displays create faculty page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.faculties.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/faculties/create')
            ->has('institutions')
        );
});

test('store creates a faculty and redirects', function () {
    $institution = Institution::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.faculties.store'), [
            'institution_id' => $institution->id,
            'name' => 'Faculty of Science',
            'abbreviation' => 'FSC',
        ])
        ->assertRedirect(route('admin.faculties.index'));

    $this->assertDatabaseHas('faculties', [
        'institution_id' => $institution->id,
        'name' => 'Faculty of Science',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.faculties.store'), [])
        ->assertSessionHasErrors(['institution_id', 'name']);
});

test('store validates unique name per institution', function () {
    $institution = Institution::factory()->create();
    Faculty::factory()->for($institution)->create(['name' => 'Faculty of Science']);

    $this->actingAs($this->admin)
        ->post(route('admin.faculties.store'), [
            'institution_id' => $institution->id,
            'name' => 'Faculty of Science',
        ])
        ->assertSessionHasErrors(['name']);
});

test('edit displays edit faculty page', function () {
    $faculty = Faculty::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.faculties.edit', $faculty))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/faculties/edit')
            ->has('faculty')
            ->has('institutions')
        );
});

test('update modifies a faculty and redirects', function () {
    $faculty = Faculty::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.faculties.update', $faculty), [
            'institution_id' => $faculty->institution_id,
            'name' => 'Updated Faculty Name',
            'abbreviation' => 'UFN',
        ])
        ->assertRedirect(route('admin.faculties.index'));

    $this->assertDatabaseHas('faculties', [
        'id' => $faculty->id,
        'name' => 'Updated Faculty Name',
    ]);
});

test('update allows keeping the same name for the same faculty', function () {
    $faculty = Faculty::factory()->create(['name' => 'Faculty of Science']);

    $this->actingAs($this->admin)
        ->put(route('admin.faculties.update', $faculty), [
            'institution_id' => $faculty->institution_id,
            'name' => 'Faculty of Science',
        ])
        ->assertRedirect(route('admin.faculties.index'));
});

test('guests cannot access faculty routes', function () {
    $this->get(route('admin.faculties.index'))->assertRedirect(route('login'));
    $this->get(route('admin.faculties.create'))->assertRedirect(route('login'));
});
