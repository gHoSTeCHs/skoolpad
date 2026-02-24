<?php

use App\Enums\ScaleType;
use App\Models\GradingScale;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays grading scales page', function () {
    GradingScale::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.grading-scales.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/grading-scales/index')
            ->has('gradingScales.data', 3)
            ->has('gradingScales.meta.current_page')
            ->has('scaleTypes')
        );
});

test('index filters by search', function () {
    GradingScale::factory()->create(['name' => 'WAEC Grade Scale']);
    GradingScale::factory()->create(['name' => 'University CGPA']);

    $this->actingAs($this->admin)
        ->get(route('admin.grading-scales.index', ['search' => 'WAEC']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('gradingScales.data', 1));
});

test('index filters by scale type', function () {
    GradingScale::factory()->create(['scale_type' => ScaleType::Percentage]);
    GradingScale::factory()->create(['scale_type' => ScaleType::Cgpa]);

    $this->actingAs($this->admin)
        ->get(route('admin.grading-scales.index', ['scale_type' => 'percentage']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('gradingScales.data', 1));
});

test('create displays create page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.grading-scales.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/grading-scales/create')
            ->has('scaleTypes')
        );
});

test('store creates a grading scale', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.grading-scales.store'), [
            'name' => 'Test Scale',
            'scale_type' => 'percentage',
            'scale_min' => 0,
            'scale_max' => 100,
            'pass_threshold' => 40,
            'grade_boundaries' => json_encode([
                ['label' => 'A', 'min' => 70, 'max' => 100],
            ]),
        ])
        ->assertRedirect(route('admin.grading-scales.index'));

    $this->assertDatabaseHas('grading_scales', ['name' => 'Test Scale']);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.grading-scales.store'), [])
        ->assertSessionHasErrors(['name', 'scale_type', 'scale_min', 'scale_max', 'pass_threshold', 'grade_boundaries']);
});

test('store validates unique name', function () {
    GradingScale::factory()->create(['name' => 'Existing Scale']);

    $this->actingAs($this->admin)
        ->post(route('admin.grading-scales.store'), [
            'name' => 'Existing Scale',
            'scale_type' => 'percentage',
            'scale_min' => 0,
            'scale_max' => 100,
            'pass_threshold' => 40,
            'grade_boundaries' => json_encode([]),
        ])
        ->assertSessionHasErrors(['name']);
});

test('edit displays edit page', function () {
    $scale = GradingScale::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.grading-scales.edit', $scale))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/grading-scales/edit')
            ->has('gradingScale')
            ->has('scaleTypes')
        );
});

test('update modifies a grading scale', function () {
    $scale = GradingScale::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.grading-scales.update', $scale), [
            'name' => 'Updated Scale',
            'scale_type' => $scale->scale_type->value,
            'scale_min' => $scale->scale_min,
            'scale_max' => $scale->scale_max,
            'pass_threshold' => $scale->pass_threshold,
            'grade_boundaries' => json_encode($scale->grade_boundaries),
        ])
        ->assertRedirect(route('admin.grading-scales.index'));

    expect($scale->fresh()->name)->toBe('Updated Scale');
});

test('update allows keeping the same name', function () {
    $scale = GradingScale::factory()->create(['name' => 'Keep Me']);

    $this->actingAs($this->admin)
        ->put(route('admin.grading-scales.update', $scale), [
            'name' => 'Keep Me',
            'scale_type' => $scale->scale_type->value,
            'scale_min' => $scale->scale_min,
            'scale_max' => $scale->scale_max,
            'pass_threshold' => $scale->pass_threshold,
            'grade_boundaries' => json_encode($scale->grade_boundaries),
        ])
        ->assertRedirect(route('admin.grading-scales.index'));
});
