<?php

use App\Models\Faculty;
use App\Models\Institution;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->institution = Institution::factory()->create();
});

test('index displays faculties page scoped to institution', function () {
    Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Science']);
    Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Engineering']);
    Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Arts']);
    Faculty::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.faculties.index', $this->institution))
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
            ->has('institution')
        );
});

test('index filters faculties by search', function () {
    Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Engineering']);
    Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Arts']);

    $this->actingAs($this->admin)
        ->get(route('admin.faculties.index', [$this->institution, 'search' => 'Engineering']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('faculties.data', 1)
        );
});

test('create displays create faculty page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.faculties.create', $this->institution))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/faculties/create')
            ->has('institution')
        );
});

test('store creates a faculty and redirects', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.faculties.store', $this->institution), [
            'name' => 'Faculty of Science',
            'abbreviation' => 'FSC',
        ])
        ->assertRedirect(route('admin.faculties.index', $this->institution));

    $this->assertDatabaseHas('faculties', [
        'institution_id' => $this->institution->id,
        'name' => 'Faculty of Science',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.faculties.store', $this->institution), [])
        ->assertSessionHasErrors(['name']);
});

test('store validates unique name per institution', function () {
    Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Science']);

    $this->actingAs($this->admin)
        ->post(route('admin.faculties.store', $this->institution), [
            'name' => 'Faculty of Science',
        ])
        ->assertSessionHasErrors(['name']);
});

test('edit displays edit faculty page', function () {
    $faculty = Faculty::factory()->for($this->institution)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.faculties.edit', $faculty))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/faculties/edit')
            ->has('faculty')
        );
});

test('update modifies a faculty and redirects', function () {
    $faculty = Faculty::factory()->for($this->institution)->create();

    $this->actingAs($this->admin)
        ->put(route('admin.faculties.update', $faculty), [
            'name' => 'Updated Faculty Name',
            'abbreviation' => 'UFN',
        ])
        ->assertRedirect(route('admin.faculties.index', $this->institution));

    $this->assertDatabaseHas('faculties', [
        'id' => $faculty->id,
        'name' => 'Updated Faculty Name',
    ]);
});

test('update allows keeping the same name for the same faculty', function () {
    $faculty = Faculty::factory()->for($this->institution)->create(['name' => 'Faculty of Science']);

    $this->actingAs($this->admin)
        ->put(route('admin.faculties.update', $faculty), [
            'name' => 'Faculty of Science',
        ])
        ->assertRedirect(route('admin.faculties.index', $this->institution));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.faculties.index', $this->institution))
        ->assertForbidden();
});

test('staff without manage_institutions permission get 403', function () {
    $staff = User::factory()->contentManager()->create();

    $this->actingAs($staff)
        ->get(route('admin.faculties.index', $this->institution))
        ->assertForbidden();
});

test('guests cannot access faculty routes', function () {
    $institution = Institution::factory()->create();
    $this->get(route('admin.faculties.index', $institution))->assertRedirect(route('login'));
    $this->get(route('admin.faculties.create', $institution))->assertRedirect(route('login'));
});
