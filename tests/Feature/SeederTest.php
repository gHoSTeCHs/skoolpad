<?php

use App\Enums\EducationSystemType;
use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Enums\ScaleType;
use App\Enums\UserRole;
use App\Models\AssessmentType;
use App\Models\Country;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\ExamType;
use App\Models\Faculty;
use App\Models\GradingScale;
use App\Models\Institution;
use App\Models\InstitutionType as InstitutionTypeModel;
use App\Models\LevelSubject;
use App\Models\PlatformSetting;
use App\Models\Stream;
use App\Models\SubscriptionPlan;
use App\Models\User;

beforeEach(function () {
    $this->artisan('db:seed', ['--no-interaction' => true]);
});

test('nigeria exists in countries table', function () {
    expect(Country::where('code', 'NG')->exists())->toBeTrue();

    $nigeria = Country::where('code', 'NG')->first();

    expect($nigeria->name)->toBe('Nigeria')
        ->and($nigeria->currency_code)->toBe('NGN');
});

test('8 disciplines exist', function () {
    expect(Discipline::count())->toBe(8);

    expect(Discipline::where('slug', 'computer-science')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'mass-communication')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'english')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'mechanical-engineering')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'mathematics')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'physics')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'chemistry')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'biology')->exists())->toBeTrue();
});

test('5 institutions exist with correct types and ownership', function () {
    expect(Institution::count())->toBe(5);

    $federal = Institution::where('ownership_type', OwnershipType::Federal)->get();
    $state = Institution::where('ownership_type', OwnershipType::State)->get();

    expect($federal)->toHaveCount(3)
        ->and($state)->toHaveCount(2);

    expect(Institution::where('institution_type', InstitutionType::University)->count())->toBe(5);
});

test('14 faculties exist', function () {
    expect(Faculty::count())->toBe(14);
});

test('28 departments exist', function () {
    expect(Department::count())->toBe(28);
});

test('3 exam types exist and all are inactive', function () {
    expect(ExamType::count())->toBe(3);

    $activeExams = ExamType::where('is_active', true)->count();

    expect($activeExams)->toBe(0);

    $jamb = ExamType::where('slug', 'jamb-utme')->first();

    expect($jamb)->not->toBeNull()
        ->and($jamb->duration_minutes)->toBe(120)
        ->and($jamb->questions_per_subject)->toBe(60);
});

test('2 platform settings exist with correct values', function () {
    expect(PlatformSetting::count())->toBe(2);

    $monetization = PlatformSetting::where('key', 'monetization_enabled')->first();
    $registration = PlatformSetting::where('key', 'registration_open')->first();

    expect($monetization)->not->toBeNull()
        ->and($monetization->value)->toBeFalsy()
        ->and($registration)->not->toBeNull()
        ->and($registration->value)->toBeTruthy();
});

test('3 subscription plans exist with correct prices', function () {
    expect(SubscriptionPlan::count())->toBe(3);

    $free = SubscriptionPlan::where('name', 'free')->first();
    $scholar = SubscriptionPlan::where('name', 'scholar')->first();
    $scholarPro = SubscriptionPlan::where('name', 'scholar-pro')->first();

    expect($free->price_ngn)->toBe(0)
        ->and($scholar->price_ngn)->toBe(200000)
        ->and($scholarPro->price_ngn)->toBe(500000)
        ->and($free->is_active)->toBeTrue()
        ->and($scholar->is_active)->toBeTrue()
        ->and($scholarPro->is_active)->toBeTrue();
});

test('admin user exists with super_admin role', function () {
    $admin = User::where('email', 'admin@skoolpad.com')->first();

    expect($admin)->not->toBeNull()
        ->and($admin->name)->toBe('Super Admin')
        ->and($admin->role)->toBe(UserRole::SuperAdmin)
        ->and($admin->is_active)->toBeTrue();
});

test('NERDC education system exists', function () {
    $nerdc = EducationSystem::where('slug', 'nerdc')->first();

    expect($nerdc)->not->toBeNull()
        ->and($nerdc->system_type)->toBe(EducationSystemType::National)
        ->and($nerdc->country)->not->toBeNull();

    $waec = EducationSystem::where('slug', 'waec')->first();

    expect($waec)->not->toBeNull()
        ->and($waec->system_type)->toBe(EducationSystemType::ExamBoard)
        ->and($waec->country_id)->toBeNull();
});

test('3 curriculum tiers exist for NERDC', function () {
    $nerdc = EducationSystem::where('slug', 'nerdc')->first();
    $tiers = CurriculumTier::where('education_system_id', $nerdc->id)->orderBy('sort_order')->get();

    expect($tiers)->toHaveCount(3)
        ->and($tiers[0]->slug)->toBe('junior-secondary')
        ->and($tiers[0]->is_tertiary)->toBeFalse()
        ->and($tiers[1]->slug)->toBe('senior-secondary')
        ->and($tiers[2]->slug)->toBe('tertiary')
        ->and($tiers[2]->is_tertiary)->toBeTrue();
});

test('11 education levels exist across tiers', function () {
    expect(EducationLevel::count())->toBe(11);

    $jss = CurriculumTier::where('slug', 'junior-secondary')->first();
    $ss = CurriculumTier::where('slug', 'senior-secondary')->first();
    $tertiary = CurriculumTier::where('slug', 'tertiary')->first();

    expect(EducationLevel::where('curriculum_tier_id', $jss->id)->count())->toBe(3)
        ->and(EducationLevel::where('curriculum_tier_id', $ss->id)->count())->toBe(3)
        ->and(EducationLevel::where('curriculum_tier_id', $tertiary->id)->count())->toBe(5);
});

test('3 streams exist for senior secondary', function () {
    expect(Stream::count())->toBe(3);

    expect(Stream::where('name', 'Science')->exists())->toBeTrue()
        ->and(Stream::where('name', 'Arts')->exists())->toBeTrue()
        ->and(Stream::where('name', 'Commercial')->exists())->toBeTrue();
});

test('2 grading scales exist', function () {
    expect(GradingScale::count())->toBe(2);

    $waecScale = GradingScale::where('name', 'WAEC A1-F9')->first();
    $cgpaScale = GradingScale::where('scale_type', ScaleType::Cgpa)->first();

    expect($waecScale)->not->toBeNull()
        ->and($waecScale->scale_type)->toBe(ScaleType::Points)
        ->and($cgpaScale)->not->toBeNull()
        ->and($cgpaScale->classification_labels)->not->toBeNull();
});

test('6 curriculum subjects exist', function () {
    expect(CurriculumSubject::count())->toBe(6);
});

test('24 level subjects exist with correct compulsory flags', function () {
    expect(LevelSubject::count())->toBe(24);

    $compulsory = LevelSubject::where('is_compulsory', true)->count();
    $optional = LevelSubject::where('is_compulsory', false)->count();

    expect($compulsory)->toBe(15)
        ->and($optional)->toBe(9);
});

test('2 assessment types exist', function () {
    expect(AssessmentType::count())->toBe(2);

    $wassce = AssessmentType::where('slug', 'wassce')->first();

    expect($wassce)->not->toBeNull()
        ->and($wassce->is_exit_exam)->toBeTrue()
        ->and($wassce->is_entrance_exam)->toBeFalse();
});

test('3 institution types exist', function () {
    expect(InstitutionTypeModel::count())->toBe(3);

    $university = InstitutionTypeModel::where('slug', 'university')->first();

    expect($university)->not->toBeNull()
        ->and($university->level_progression)->toBeArray()
        ->and($university->qualification_names)->toContain('B.Sc.');
});

test('all institutions are linked to NERDC education system', function () {
    $nerdc = EducationSystem::where('slug', 'nerdc')->first();

    expect($nerdc->institutions()->count())->toBe(5);
});
