<?php

use App\Enums\UserRole;

test('has exactly 6 cases', function () {
    expect(UserRole::cases())->toHaveCount(6);
});

test('has correct case values', function () {
    expect(UserRole::SuperAdmin->value)->toBe('super_admin')
        ->and(UserRole::ContentManager->value)->toBe('content_manager')
        ->and(UserRole::InstitutionModerator->value)->toBe('institution_moderator')
        ->and(UserRole::ContentReviewer->value)->toBe('content_reviewer')
        ->and(UserRole::CommunityModerator->value)->toBe('community_moderator')
        ->and(UserRole::Student->value)->toBe('student');
});

test('label returns non-empty string for each case', function () {
    foreach (UserRole::cases() as $role) {
        expect($role->label())->toBeString()->not->toBeEmpty();
    }
});

test('description returns non-empty string for each case', function () {
    foreach (UserRole::cases() as $role) {
        expect($role->description())->toBeString()->not->toBeEmpty();
    }
});

test('level returns correct hierarchy', function () {
    expect(UserRole::SuperAdmin->level())->toBe(999)
        ->and(UserRole::ContentManager->level())->toBe(100)
        ->and(UserRole::InstitutionModerator->level())->toBe(70)
        ->and(UserRole::ContentReviewer->level())->toBe(60)
        ->and(UserRole::CommunityModerator->level())->toBe(50)
        ->and(UserRole::Student->level())->toBe(10);
});

test('level hierarchy is strictly ordered', function () {
    expect(UserRole::SuperAdmin->level())
        ->toBeGreaterThan(UserRole::ContentManager->level())
        ->and(UserRole::ContentManager->level())
        ->toBeGreaterThan(UserRole::InstitutionModerator->level())
        ->and(UserRole::InstitutionModerator->level())
        ->toBeGreaterThan(UserRole::ContentReviewer->level())
        ->and(UserRole::ContentReviewer->level())
        ->toBeGreaterThan(UserRole::CommunityModerator->level())
        ->and(UserRole::CommunityModerator->level())
        ->toBeGreaterThan(UserRole::Student->level());
});

test('isAdmin returns true only for SuperAdmin', function () {
    expect(UserRole::SuperAdmin->isAdmin())->toBeTrue();

    $nonAdminRoles = [
        UserRole::ContentManager,
        UserRole::InstitutionModerator,
        UserRole::ContentReviewer,
        UserRole::CommunityModerator,
        UserRole::Student,
    ];

    foreach ($nonAdminRoles as $role) {
        expect($role->isAdmin())->toBeFalse();
    }
});

test('isStaff returns true for all roles except Student', function () {
    $staffRoles = [
        UserRole::SuperAdmin,
        UserRole::ContentManager,
        UserRole::InstitutionModerator,
        UserRole::ContentReviewer,
        UserRole::CommunityModerator,
    ];

    foreach ($staffRoles as $role) {
        expect($role->isStaff())->toBeTrue();
    }

    expect(UserRole::Student->isStaff())->toBeFalse();
});

test('permissions returns all permissions for SuperAdmin', function () {
    $permissions = UserRole::SuperAdmin->permissions();

    expect($permissions)->toBeArray()->not->toBeEmpty()
        ->and($permissions)->toContain('manage_platform_settings')
        ->and($permissions)->toContain('manage_all_users')
        ->and($permissions)->toContain('toggle_monetization');
});

test('permissions returns empty-like array for Student with view-only permissions', function () {
    $permissions = UserRole::Student->permissions();

    expect($permissions)->toBeArray()
        ->and($permissions)->not->toContain('manage_platform_settings')
        ->and($permissions)->not->toContain('manage_all_users')
        ->and($permissions)->toContain('view_content')
        ->and($permissions)->toContain('practice_questions');
});

test('hasPermission works correctly', function () {
    expect(UserRole::ContentReviewer->hasPermission('review_submissions'))->toBeTrue()
        ->and(UserRole::ContentReviewer->hasPermission('manage_institutions'))->toBeFalse()
        ->and(UserRole::SuperAdmin->hasPermission('manage_platform_settings'))->toBeTrue()
        ->and(UserRole::Student->hasPermission('manage_all_users'))->toBeFalse();
});

test('staffRoles returns 4 roles excluding SuperAdmin and Student', function () {
    $staffRoles = UserRole::staffRoles();

    expect($staffRoles)->toHaveCount(4)
        ->and($staffRoles)->not->toContain(UserRole::SuperAdmin)
        ->and($staffRoles)->not->toContain(UserRole::Student)
        ->and($staffRoles)->toContain(UserRole::ContentManager)
        ->and($staffRoles)->toContain(UserRole::InstitutionModerator)
        ->and($staffRoles)->toContain(UserRole::ContentReviewer)
        ->and($staffRoles)->toContain(UserRole::CommunityModerator);
});

test('forAdminSelect returns array with 6 entries', function () {
    $select = UserRole::forAdminSelect();

    expect($select)->toBeArray()->toHaveCount(6)
        ->and($select)->toHaveKeys([
            'super_admin',
            'content_manager',
            'institution_moderator',
            'content_reviewer',
            'community_moderator',
            'student',
        ]);
});

test('forStaffSelect returns array with 4 entries', function () {
    $select = UserRole::forStaffSelect();

    expect($select)->toBeArray()->toHaveCount(4)
        ->and($select)->toHaveKeys([
            'content_manager',
            'institution_moderator',
            'content_reviewer',
            'community_moderator',
        ])
        ->and($select)->not->toHaveKey('super_admin')
        ->and($select)->not->toHaveKey('student');
});
