<?php

use App\Models\Country;
use App\Models\ExamType;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays exam types page', function () {
    ExamType::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.exam-types.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-types/index')
            ->has('examTypes.data', 3)
            ->has('examTypes.meta.current_page')
            ->has('examTypes.meta.last_page')
            ->has('examTypes.meta.per_page')
            ->has('examTypes.meta.total')
            ->has('examTypes.links.prev')
            ->has('examTypes.links.next')
        );
});

test('index filters exam types by search', function () {
    ExamType::factory()->create(['name' => 'WASSCE Exam']);
    ExamType::factory()->create(['name' => 'JAMB Exam']);

    $this->actingAs($this->admin)
        ->get(route('admin.exam-types.index', ['search' => 'WASSCE']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('examTypes.data', 1)
        );
});

test('index filters exam types by is_active', function () {
    ExamType::factory()->create(['is_active' => true]);
    ExamType::factory()->create(['is_active' => false]);

    $this->actingAs($this->admin)
        ->get(route('admin.exam-types.index', ['is_active' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('examTypes.data', 1)
        );
});

test('create displays create exam type page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.exam-types.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-types/create')
            ->has('countries')
        );
});

test('store creates an exam type and redirects', function () {
    $country = Country::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.exam-types.store'), [
            'country_id' => $country->id,
            'name' => 'Test Exam',
            'slug' => 'test-exam',
            'description' => 'A test exam type',
            'duration_minutes' => 120,
            'questions_per_subject' => 40,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.exam-types.index'));

    $this->assertDatabaseHas('exam_types', [
        'country_id' => $country->id,
        'name' => 'Test Exam',
        'slug' => 'test-exam',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.exam-types.store'), [])
        ->assertSessionHasErrors(['country_id', 'name']);
});

test('store validates unique name and slug', function () {
    ExamType::factory()->create(['name' => 'WASSCE', 'slug' => 'wassce']);

    $this->actingAs($this->admin)
        ->post(route('admin.exam-types.store'), [
            'country_id' => Country::factory()->create()->id,
            'name' => 'WASSCE',
            'slug' => 'wassce',
        ])
        ->assertSessionHasErrors(['name', 'slug']);
});

test('store validates slug is alpha_dash', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.exam-types.store'), [
            'country_id' => Country::factory()->create()->id,
            'name' => 'Some Exam',
            'slug' => 'invalid slug with spaces',
        ])
        ->assertSessionHasErrors(['slug']);
});

test('edit displays edit exam type page', function () {
    $examType = ExamType::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.exam-types.edit', $examType))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-types/edit')
            ->has('examType')
            ->has('countries')
        );
});

test('update modifies an exam type and redirects', function () {
    $examType = ExamType::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.exam-types.update', $examType), [
            'country_id' => $examType->country_id,
            'name' => 'Updated Exam',
            'slug' => 'updated-exam',
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.exam-types.index'));

    $this->assertDatabaseHas('exam_types', [
        'id' => $examType->id,
        'name' => 'Updated Exam',
        'slug' => 'updated-exam',
    ]);
});

test('update allows keeping the same name and slug', function () {
    $examType = ExamType::factory()->create(['name' => 'WASSCE', 'slug' => 'wassce']);

    $this->actingAs($this->admin)
        ->put(route('admin.exam-types.update', $examType), [
            'country_id' => $examType->country_id,
            'name' => 'WASSCE',
            'slug' => 'wassce',
        ])
        ->assertRedirect(route('admin.exam-types.index'));
});

test('guests cannot access exam type routes', function () {
    $this->get(route('admin.exam-types.index'))->assertRedirect(route('login'));
    $this->get(route('admin.exam-types.create'))->assertRedirect(route('login'));
});
