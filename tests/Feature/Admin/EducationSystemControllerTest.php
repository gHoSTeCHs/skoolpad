<?php

use App\Enums\EducationSystemType;
use App\Models\Country;
use App\Models\CurriculumTier;
use App\Models\EducationSystem;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays education systems page', function () {
    EducationSystem::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/education-systems/index')
            ->has('educationSystems.data', 3)
            ->has('educationSystems.meta.current_page')
            ->has('educationSystems.meta.last_page')
            ->has('educationSystems.meta.per_page')
            ->has('educationSystems.meta.total')
            ->has('educationSystems.links.prev')
            ->has('educationSystems.links.next')
            ->has('systemTypes')
        );
});

test('index filters by search', function () {
    EducationSystem::factory()->create(['name' => 'NERDC Curriculum']);
    EducationSystem::factory()->create(['name' => 'Cambridge International']);

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.index', ['search' => 'NERDC']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('educationSystems.data', 1));
});

test('index filters by system type', function () {
    EducationSystem::factory()->create(['system_type' => EducationSystemType::National]);
    EducationSystem::factory()->create(['system_type' => EducationSystemType::ExamBoard]);

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.index', ['system_type' => 'national']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('educationSystems.data', 1));
});

test('index sorts by name', function () {
    EducationSystem::factory()->create(['name' => 'Zebra System']);
    EducationSystem::factory()->create(['name' => 'Alpha System']);

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.index', ['sort' => 'name', 'direction' => 'asc']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('educationSystems.data', 2)
            ->where('educationSystems.data.0.name', 'Alpha System')
        );
});

test('create displays create page with enum options', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/education-systems/create')
            ->has('systemTypes')
            ->has('countries')
        );
});

test('store creates a system and redirects', function () {
    $country = Country::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.education-systems.store'), [
            'name' => 'Test System',
            'slug' => 'test-system',
            'system_type' => 'national',
            'country_id' => $country->id,
        ])
        ->assertRedirect(route('admin.education-systems.index'));

    $this->assertDatabaseHas('education_systems', [
        'name' => 'Test System',
        'slug' => 'test-system',
    ]);
});

test('store auto-generates slug when omitted', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.education-systems.store'), [
            'name' => 'Auto Slug System',
            'system_type' => 'national',
        ])
        ->assertRedirect(route('admin.education-systems.index'));

    $this->assertDatabaseHas('education_systems', [
        'name' => 'Auto Slug System',
        'slug' => 'auto-slug-system',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.education-systems.store'), [])
        ->assertSessionHasErrors(['name', 'system_type']);
});

test('store validates unique name', function () {
    EducationSystem::factory()->create(['name' => 'Existing']);

    $this->actingAs($this->admin)
        ->post(route('admin.education-systems.store'), [
            'name' => 'Existing',
            'system_type' => 'national',
        ])
        ->assertSessionHasErrors(['name']);
});

test('store validates unique slug', function () {
    EducationSystem::factory()->create(['slug' => 'taken-slug']);

    $this->actingAs($this->admin)
        ->post(route('admin.education-systems.store'), [
            'name' => 'New System',
            'slug' => 'taken-slug',
            'system_type' => 'national',
        ])
        ->assertSessionHasErrors(['slug']);
});

test('show loads all nested data', function () {
    $system = EducationSystem::factory()->create();
    CurriculumTier::factory()->create(['education_system_id' => $system->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.show', $system))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/education-systems/show')
            ->has('educationSystem.curriculum_tiers', 1)
            ->has('disciplines')
            ->has('gradingScales')
        );
});

test('edit displays edit page with existing data', function () {
    $system = EducationSystem::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.education-systems.edit', $system))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/education-systems/edit')
            ->has('educationSystem')
            ->has('systemTypes')
            ->has('countries')
        );
});

test('update modifies a system and redirects', function () {
    $system = EducationSystem::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.education-systems.update', $system), [
            'name' => 'Updated Name',
            'slug' => $system->slug,
            'system_type' => $system->system_type->value,
        ])
        ->assertRedirect(route('admin.education-systems.show', $system));

    expect($system->fresh()->name)->toBe('Updated Name');
});

test('update allows keeping same name and slug', function () {
    $system = EducationSystem::factory()->create(['name' => 'Keep Me', 'slug' => 'keep-me']);

    $this->actingAs($this->admin)
        ->put(route('admin.education-systems.update', $system), [
            'name' => 'Keep Me',
            'slug' => 'keep-me',
            'system_type' => $system->system_type->value,
        ])
        ->assertRedirect(route('admin.education-systems.show', $system));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.education-systems.index'))
        ->assertForbidden();
});

test('guests cannot access education system routes', function () {
    $this->get(route('admin.education-systems.index'))->assertRedirect(route('login'));
    $this->get(route('admin.education-systems.create'))->assertRedirect(route('login'));
});
