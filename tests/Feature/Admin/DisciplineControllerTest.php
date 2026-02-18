<?php

use App\Models\Discipline;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays disciplines page', function () {
    Discipline::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.disciplines.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/disciplines/index')
            ->has('disciplines.data', 3)
            ->has('disciplines.meta.current_page')
            ->has('disciplines.meta.last_page')
            ->has('disciplines.meta.per_page')
            ->has('disciplines.meta.total')
            ->has('disciplines.links.prev')
            ->has('disciplines.links.next')
        );
});

test('index filters disciplines by search', function () {
    Discipline::factory()->create(['name' => 'Mathematics']);
    Discipline::factory()->create(['name' => 'Physics']);

    $this->actingAs($this->admin)
        ->get(route('admin.disciplines.index', ['search' => 'Math']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('disciplines.data', 1)
        );
});

test('create displays create discipline page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.disciplines.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/disciplines/create')
        );
});

test('store creates a discipline and redirects', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.disciplines.store'), [
            'name' => 'Computer Science',
            'slug' => 'computer-science',
            'description' => 'Study of computation',
        ])
        ->assertRedirect(route('admin.disciplines.index'));

    $this->assertDatabaseHas('disciplines', [
        'name' => 'Computer Science',
        'slug' => 'computer-science',
    ]);
});

test('store auto-generates slug from name when slug is omitted', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.disciplines.store'), [
            'name' => 'Computer Science',
            'description' => 'Study of computation',
        ])
        ->assertRedirect(route('admin.disciplines.index'));

    $this->assertDatabaseHas('disciplines', [
        'name' => 'Computer Science',
        'slug' => 'computer-science',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.disciplines.store'), [])
        ->assertSessionHasErrors(['name']);
});

test('store validates unique name', function () {
    Discipline::factory()->create(['name' => 'Mathematics']);

    $this->actingAs($this->admin)
        ->post(route('admin.disciplines.store'), [
            'name' => 'Mathematics',
            'slug' => 'mathematics-new',
        ])
        ->assertSessionHasErrors(['name']);
});

test('store validates unique slug', function () {
    Discipline::factory()->create(['slug' => 'mathematics']);

    $this->actingAs($this->admin)
        ->post(route('admin.disciplines.store'), [
            'name' => 'New Discipline',
            'slug' => 'mathematics',
        ])
        ->assertSessionHasErrors(['slug']);
});

test('store validates slug is alpha_dash', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.disciplines.store'), [
            'name' => 'Some Discipline',
            'slug' => 'invalid slug with spaces',
        ])
        ->assertSessionHasErrors(['slug']);
});

test('edit displays edit discipline page', function () {
    $discipline = Discipline::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.disciplines.edit', $discipline))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/disciplines/edit')
            ->has('discipline')
        );
});

test('update modifies a discipline and redirects', function () {
    $discipline = Discipline::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.disciplines.update', $discipline), [
            'name' => 'Updated Discipline',
            'slug' => 'updated-discipline',
        ])
        ->assertRedirect(route('admin.disciplines.index'));

    $this->assertDatabaseHas('disciplines', [
        'id' => $discipline->id,
        'name' => 'Updated Discipline',
        'slug' => 'updated-discipline',
    ]);
});

test('update allows keeping the same name and slug', function () {
    $discipline = Discipline::factory()->create(['name' => 'Mathematics', 'slug' => 'mathematics']);

    $this->actingAs($this->admin)
        ->put(route('admin.disciplines.update', $discipline), [
            'name' => 'Mathematics',
            'slug' => 'mathematics',
        ])
        ->assertRedirect(route('admin.disciplines.index'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.disciplines.index'))
        ->assertForbidden();
});

test('guests cannot access discipline routes', function () {
    $this->get(route('admin.disciplines.index'))->assertRedirect(route('login'));
    $this->get(route('admin.disciplines.create'))->assertRedirect(route('login'));
});
