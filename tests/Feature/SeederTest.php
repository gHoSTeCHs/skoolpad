<?php

use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Enums\UserRole;
use App\Models\Country;
use App\Models\Department;
use App\Models\Discipline;
use App\Models\ExamType;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\PlatformSetting;
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

test('4 disciplines exist', function () {
    expect(Discipline::count())->toBe(4);

    expect(Discipline::where('slug', 'computer-science')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'mass-communication')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'english')->exists())->toBeTrue()
        ->and(Discipline::where('slug', 'mechanical-engineering')->exists())->toBeTrue();
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
