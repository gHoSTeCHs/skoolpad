<?php

use App\Models\CalendarTerm;
use App\Models\EducationSystem;
use App\Models\Institution;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->institution = Institution::factory()->create();
});

test('show displays institution details with tabs', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.institutions.show', $this->institution))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/institutions/show')
            ->where('institution.id', $this->institution->id)
            ->has('educationSystems')
        );
});

test('attach education system to institution', function () {
    $system = EducationSystem::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.institutions.education-systems.attach', $this->institution), [
            'education_system_id' => $system->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('institution_education_systems', [
        'institution_id' => $this->institution->id,
        'education_system_id' => $system->id,
    ]);
});

test('detach education system from institution', function () {
    $system = EducationSystem::factory()->create();
    $this->institution->educationSystems()->attach($system->id);

    $this->actingAs($this->admin)
        ->delete(route('admin.institutions.education-systems.detach', [
            'institution' => $this->institution->id,
            'education_system' => $system->id,
        ]))
        ->assertRedirect();

    $this->assertDatabaseMissing('institution_education_systems', [
        'institution_id' => $this->institution->id,
        'education_system_id' => $system->id,
    ]);
});

test('store creates a calendar term', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.calendar-terms.store', $this->institution), [
            'academic_year' => '2025/2026',
            'name' => 'First Semester',
            'start_date' => '2025-09-01',
            'end_date' => '2026-01-31',
            'sort_order' => 1,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('calendar_terms', [
        'institution_id' => $this->institution->id,
        'academic_year' => '2025/2026',
        'name' => 'First Semester',
    ]);
});

test('update modifies a calendar term', function () {
    $term = CalendarTerm::factory()->create(['institution_id' => $this->institution->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.calendar-terms.update', $term), [
            'academic_year' => '2025/2026',
            'name' => 'Updated Term',
            'start_date' => '2025-09-01',
            'end_date' => '2026-01-31',
            'sort_order' => 2,
        ])
        ->assertRedirect();

    expect($term->fresh()->name)->toBe('Updated Term');
});

test('destroy deletes a calendar term', function () {
    $term = CalendarTerm::factory()->create(['institution_id' => $this->institution->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.calendar-terms.destroy', $term))
        ->assertRedirect();

    $this->assertDatabaseMissing('calendar_terms', ['id' => $term->id]);
});

test('calendar term store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.calendar-terms.store', $this->institution), [])
        ->assertSessionHasErrors(['academic_year', 'name', 'start_date', 'end_date', 'sort_order']);
});

test('staff without manage_institutions permission get 403', function () {
    $staff = User::factory()->contentManager()->create();

    $this->actingAs($staff)
        ->post(route('admin.calendar-terms.store', $this->institution), [
            'academic_year' => '2025/2026',
            'name' => 'Blocked Term',
            'start_date' => '2025-09-01',
            'end_date' => '2026-01-31',
            'sort_order' => 1,
        ])
        ->assertForbidden();
});
