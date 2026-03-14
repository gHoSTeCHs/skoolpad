<?php

use App\Enums\ScaleType;
use App\Models\CgpaSimulation;
use App\Models\GradingScale;
use App\Models\Institution;
use App\Models\InstitutionType as InstitutionTypeModel;
use App\Models\StudentProfile;
use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

function createTertiaryStudentWithScale(): array
{
    $scale = GradingScale::factory()->create([
        'name' => 'University CGPA (5-point)',
        'scale_type' => ScaleType::Cgpa,
        'scale_min' => 0,
        'scale_max' => 5,
        'pass_threshold' => 1,
        'grade_boundaries' => [
            ['label' => 'A', 'min' => 70, 'max' => 100, 'gp' => 5, 'is_pass' => true],
            ['label' => 'B', 'min' => 60, 'max' => 69, 'gp' => 4, 'is_pass' => true],
            ['label' => 'C', 'min' => 50, 'max' => 59, 'gp' => 3, 'is_pass' => true],
            ['label' => 'D', 'min' => 45, 'max' => 49, 'gp' => 2, 'is_pass' => true],
            ['label' => 'E', 'min' => 40, 'max' => 44, 'gp' => 1, 'is_pass' => true],
            ['label' => 'F', 'min' => 0, 'max' => 39, 'gp' => 0, 'is_pass' => false],
        ],
        'classification_labels' => [
            ['label' => 'First Class', 'min_cgpa' => 4.5],
            ['label' => 'Second Class Upper', 'min_cgpa' => 3.5],
            ['label' => 'Second Class Lower', 'min_cgpa' => 2.4],
            ['label' => 'Third Class', 'min_cgpa' => 1.5],
            ['label' => 'Pass', 'min_cgpa' => 1.0],
        ],
    ]);

    $institutionType = InstitutionTypeModel::factory()->create([
        'grading_scale_id' => $scale->id,
        'level_progression' => ['100L', '200L', '300L', '400L'],
    ]);

    $profile = StudentProfile::factory()->create();
    $institution = Institution::query()->find($profile->institution_id);
    $institution->update(['institution_type_id' => $institutionType->id]);

    return ['user' => $profile->user, 'profile' => $profile, 'scale' => $scale];
}

it('renders the cgpa simulator page for tertiary student', function () {
    ['user' => $user] = createTertiaryStudentWithScale();

    $response = $this->actingAs($user)->get(route('cgpa-simulator.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('cgpa-simulator/index')
        ->where('isSecondary', false)
        ->has('gradingScale')
        ->has('simulations')
        ->has('enrolledCourses')
        ->has('levelProgression')
    );
});

it('passes isSecondary true for secondary students', function () {
    $profile = StudentProfile::factory()->secondary()->create();
    $user = $profile->user;

    $response = $this->actingAs($user)->get(route('cgpa-simulator.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('cgpa-simulator/index')
        ->where('isSecondary', true)
        ->where('gradingScale', null)
    );
});

it('stores a simulation', function () {
    ['user' => $user] = createTertiaryStudentWithScale();

    $response = $this->actingAs($user)->post(route('cgpa-simulator.store'), [
        'name' => 'Best Case',
        'mode' => 'quick',
        'current_cgpa' => 3.50,
        'current_credit_hours' => 60,
        'projected_grades' => [
            ['course_code' => 'CSC 401', 'credit_units' => 3, 'grade' => 'A'],
            ['course_code' => 'CSC 403', 'credit_units' => 3, 'grade' => 'B'],
        ],
    ]);

    $response->assertRedirect(route('cgpa-simulator.index'));
    $this->assertDatabaseHas('cgpa_simulations', [
        'user_id' => $user->id,
        'name' => 'Best Case',
        'mode' => 'quick',
    ]);
});

it('updates a simulation', function () {
    ['user' => $user, 'scale' => $scale] = createTertiaryStudentWithScale();

    $simulation = CgpaSimulation::factory()->create([
        'user_id' => $user->id,
        'grading_scale_id' => $scale->id,
    ]);

    $response = $this->actingAs($user)->put(route('cgpa-simulator.update', $simulation), [
        'name' => 'Updated Scenario',
        'mode' => 'quick',
        'current_cgpa' => 3.80,
        'current_credit_hours' => 72,
        'projected_grades' => [
            ['course_code' => 'CSC 501', 'credit_units' => 3, 'grade' => 'A'],
        ],
    ]);

    $response->assertRedirect(route('cgpa-simulator.index'));
    $this->assertDatabaseHas('cgpa_simulations', [
        'id' => $simulation->id,
        'name' => 'Updated Scenario',
    ]);
});

it('deletes a simulation', function () {
    ['user' => $user, 'scale' => $scale] = createTertiaryStudentWithScale();

    $simulation = CgpaSimulation::factory()->create([
        'user_id' => $user->id,
        'grading_scale_id' => $scale->id,
    ]);

    $response = $this->actingAs($user)->delete(route('cgpa-simulator.destroy', $simulation));

    $response->assertRedirect(route('cgpa-simulator.index'));
    $this->assertDatabaseMissing('cgpa_simulations', ['id' => $simulation->id]);
});

it('prevents deleting another users simulation', function () {
    ['user' => $user] = createTertiaryStudentWithScale();
    $otherUser = User::factory()->create();
    $simulation = CgpaSimulation::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->delete(route('cgpa-simulator.destroy', $simulation));

    $response->assertForbidden();
    $this->assertDatabaseHas('cgpa_simulations', ['id' => $simulation->id]);
});

it('prevents updating another users simulation', function () {
    ['user' => $user] = createTertiaryStudentWithScale();
    $otherUser = User::factory()->create();
    $simulation = CgpaSimulation::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->put(route('cgpa-simulator.update', $simulation), [
        'mode' => 'quick',
        'current_cgpa' => 3.0,
        'current_credit_hours' => 60,
        'projected_grades' => [
            ['course_code' => 'CSC 301', 'credit_units' => 3, 'grade' => 'A'],
        ],
    ]);

    $response->assertForbidden();
});

it('enforces max 10 simulations', function () {
    ['user' => $user] = createTertiaryStudentWithScale();
    CgpaSimulation::factory()->count(10)->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('cgpa-simulator.store'), [
        'mode' => 'quick',
        'current_cgpa' => 3.0,
        'current_credit_hours' => 60,
        'projected_grades' => [
            ['course_code' => 'CSC 301', 'credit_units' => 3, 'grade' => 'A'],
        ],
    ]);

    $response->assertSessionHasErrors('limit');
    expect($user->cgpaSimulations()->count())->toBe(10);
});

it('returns projected calculation via API', function () {
    ['user' => $user] = createTertiaryStudentWithScale();

    $response = $this->actingAs($user)->postJson(route('cgpa-simulator.calculate'), [
        'current_cgpa' => 3.50,
        'current_credit_hours' => 60,
        'projected_grades' => [
            ['credit_units' => 3, 'grade' => 'A'],
            ['credit_units' => 3, 'grade' => 'B'],
        ],
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['projected_cgpa', 'classification', 'new_credits', 'new_quality_points']);
});

it('returns reverse calculation via API', function () {
    ['user' => $user] = createTertiaryStudentWithScale();

    $response = $this->actingAs($user)->postJson(route('cgpa-simulator.reverse-calculate'), [
        'current_cgpa' => 3.0,
        'current_credit_hours' => 60,
        'target_cgpa' => 3.5,
        'remaining_credits' => 30,
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['required_gpa', 'is_achievable', 'minimum_grade', 'message']);
});

it('rejects store with missing required fields', function () {
    ['user' => $user] = createTertiaryStudentWithScale();

    $response = $this->actingAs($user)->postJson(route('cgpa-simulator.store'), []);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['mode', 'current_cgpa', 'current_credit_hours', 'projected_grades']);
});

it('redirects unauthenticated users', function () {
    $response = $this->get(route('cgpa-simulator.index'));

    $response->assertRedirect(route('login'));
});
