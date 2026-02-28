<?php

use App\Models\Country;
use App\Models\GradingScale;
use App\Models\InstitutionType;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->country = Country::factory()->create();
    $this->gradingScale = GradingScale::factory()->create();
});

test('index displays institution types', function () {
    InstitutionType::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.institution-types.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/institution-types/index')
            ->has('institutionTypes.data', 3)
        );
});

test('index supports search', function () {
    InstitutionType::factory()->create(['name' => 'University']);
    InstitutionType::factory()->create(['name' => 'Polytechnic']);

    $this->actingAs($this->admin)
        ->get(route('admin.institution-types.index', ['search' => 'University']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('institutionTypes.data', 1)
        );
});

test('create renders form', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.institution-types.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/institution-types/create')
            ->has('countries')
            ->has('gradingScales')
        );
});

test('store creates institution type', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.institution-types.store'), [
            'country_id' => $this->country->id,
            'name' => 'University',
            'slug' => 'university',
            'level_progression' => ['100L', '200L', '300L', '400L', '500L'],
            'credit_system' => 'Credit Units',
            'grading_scale_id' => $this->gradingScale->id,
            'qualification_names' => ['B.Sc.', 'B.A.'],
        ])
        ->assertRedirect(route('admin.institution-types.index'));

    $this->assertDatabaseHas('institution_types', [
        'name' => 'University',
        'slug' => 'university',
        'credit_system' => 'Credit Units',
    ]);
});

test('store auto-generates slug', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.institution-types.store'), [
            'country_id' => $this->country->id,
            'name' => 'College of Education',
            'level_progression' => ['NCE I', 'NCE II', 'NCE III'],
        ])
        ->assertRedirect(route('admin.institution-types.index'));

    $this->assertDatabaseHas('institution_types', [
        'name' => 'College of Education',
        'slug' => 'college-of-education',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.institution-types.store'), [])
        ->assertSessionHasErrors(['country_id', 'name', 'level_progression']);
});

test('edit renders form with existing data', function () {
    $type = InstitutionType::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.institution-types.edit', $type))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/institution-types/edit')
            ->where('institutionType.id', $type->id)
        );
});

test('update modifies institution type', function () {
    $type = InstitutionType::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.institution-types.update', $type), [
            'country_id' => $this->country->id,
            'name' => 'Updated Type',
            'slug' => $type->slug,
            'level_progression' => ['Year 1', 'Year 2'],
            'credit_system' => 'Updated System',
        ])
        ->assertRedirect(route('admin.institution-types.index'));

    expect($type->fresh()->name)->toBe('Updated Type')
        ->and($type->fresh()->credit_system)->toBe('Updated System');
});
