<?php

use App\Enums\AccountType;
use App\Enums\ParentalRelationship;
use App\Enums\ParentChildLinkStatus;
use App\Enums\StudentType;
use App\Models\EducationLevel;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\ParentAccountService;
use Illuminate\Validation\ValidationException;

beforeEach(function () {
    $this->service = new ParentAccountService;
});

test('createParentProfile creates a profile with correct attributes', function () {
    $user = User::factory()->parent()->create();

    $profile = $this->service->createParentProfile(
        user: $user,
        relationship: ParentalRelationship::Mother,
        phoneNumber: '08012345678',
    );

    expect($profile)->toBeInstanceOf(ParentProfile::class);
    expect($profile->user_id)->toBe($user->id);
    expect($profile->relationship)->toBe(ParentalRelationship::Mother);
    expect($profile->phone_number)->toBe('08012345678');
});

test('createParentProfile works without phone number', function () {
    $user = User::factory()->parent()->create();

    $profile = $this->service->createParentProfile(
        user: $user,
        relationship: ParentalRelationship::Guardian,
    );

    expect($profile->phone_number)->toBeNull();
});

test('createChildAccount creates user, profile, and active link', function () {
    $parentProfile = ParentProfile::factory()->create();
    $educationLevel = EducationLevel::factory()->create();

    $result = $this->service->createChildAccount(
        parentProfile: $parentProfile,
        childName: 'Adaeze Okafor',
        childEmail: 'adaeze@example.com',
        childPassword: 'securepassword',
        educationLevelId: $educationLevel->id,
    );

    expect($result)->toHaveKeys(['user', 'profile', 'link']);
    expect($result['user']->name)->toBe('Adaeze Okafor');
    expect($result['user']->email)->toBe('adaeze@example.com');
    expect($result['user']->account_type)->toBe(AccountType::Student);
    expect($result['profile']->student_type)->toBe(StudentType::Secondary);
    expect($result['profile']->education_level_id)->toBe($educationLevel->id);
    expect($result['link']->status)->toBe(ParentChildLinkStatus::Active);
    expect($result['link']->linked_at)->not->toBeNull();
    expect($result['link']->parent_profile_id)->toBe($parentProfile->id);
    expect($result['link']->student_profile_id)->toBe($result['profile']->id);
});

test('linkParentToStudent creates a pending link via invite code', function () {
    $parentProfile = ParentProfile::factory()->create();
    $studentProfile = StudentProfile::factory()->secondary()->create([
        'invite_code' => 'ABC123',
    ]);

    $link = $this->service->linkParentToStudent(
        parentProfile: $parentProfile,
        inviteCode: 'ABC123',
    );

    expect($link->status)->toBe(ParentChildLinkStatus::Pending);
    expect($link->parent_profile_id)->toBe($parentProfile->id);
    expect($link->student_profile_id)->toBe($studentProfile->id);
});

test('linkParentToStudent throws when already linked', function () {
    $parentProfile = ParentProfile::factory()->create();
    $studentProfile = StudentProfile::factory()->secondary()->create([
        'invite_code' => 'XYZ789',
    ]);

    $this->service->linkParentToStudent($parentProfile, 'XYZ789');

    expect(fn () => $this->service->linkParentToStudent($parentProfile, 'XYZ789'))
        ->toThrow(ValidationException::class);
});

test('linkParentToStudent throws for invalid invite code', function () {
    $parentProfile = ParentProfile::factory()->create();

    expect(fn () => $this->service->linkParentToStudent($parentProfile, 'NOPE00'))
        ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
});

test('approveLinkRequest activates a pending link', function () {
    $link = ParentChildLink::factory()->create();

    $approvedLink = $this->service->approveLinkRequest(
        studentProfile: $link->studentProfile,
        linkId: $link->id,
    );

    expect($approvedLink->status)->toBe(ParentChildLinkStatus::Active);
    expect($approvedLink->linked_at)->not->toBeNull();
});

test('approveLinkRequest rejects link belonging to different student', function () {
    $link = ParentChildLink::factory()->create();
    $otherStudent = StudentProfile::factory()->create();

    expect(fn () => $this->service->approveLinkRequest($otherStudent, $link->id))
        ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
});

test('revokeLinkRequest works for parent owner', function () {
    $link = ParentChildLink::factory()->active()->create();
    $parentUser = $link->parentProfile->user;

    $revokedLink = $this->service->revokeLinkRequest(
        requestingUser: $parentUser,
        linkId: $link->id,
    );

    expect($revokedLink->status)->toBe(ParentChildLinkStatus::Revoked);
});

test('revokeLinkRequest works for student owner', function () {
    $link = ParentChildLink::factory()->active()->create();
    $studentUser = $link->studentProfile->user;

    $revokedLink = $this->service->revokeLinkRequest(
        requestingUser: $studentUser,
        linkId: $link->id,
    );

    expect($revokedLink->status)->toBe(ParentChildLinkStatus::Revoked);
});

test('revokeLinkRequest rejects unauthorized user', function () {
    $link = ParentChildLink::factory()->active()->create();
    $randomUser = User::factory()->create();

    expect(fn () => $this->service->revokeLinkRequest($randomUser, $link->id))
        ->toThrow(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
});

test('getLinkedChildren returns only active links', function () {
    $parentProfile = ParentProfile::factory()->create();
    ParentChildLink::factory()->active()->count(2)->create(['parent_profile_id' => $parentProfile->id]);
    ParentChildLink::factory()->create(['parent_profile_id' => $parentProfile->id]);

    $children = $this->service->getLinkedChildren($parentProfile);

    expect($children)->toHaveCount(2);
});

test('getParentDashboardSummary returns children and subscription status', function () {
    $parentProfile = ParentProfile::factory()->create();
    ParentChildLink::factory()->active()->create(['parent_profile_id' => $parentProfile->id]);

    $summary = $this->service->getParentDashboardSummary($parentProfile);

    expect($summary)->toHaveKeys(['children', 'subscription_status']);
    expect($summary['children'])->toHaveCount(1);
    expect($summary['subscription_status'])->toBe('free');
});

test('sendParentInvite creates pending link without parent profile', function () {
    $studentProfile = StudentProfile::factory()->secondary()->create();

    $link = $this->service->sendParentInvite(
        studentProfile: $studentProfile,
        parentEmail: 'parent@example.com',
    );

    expect($link->student_profile_id)->toBe($studentProfile->id);
    expect($link->parent_profile_id)->toBeNull();
    expect($link->status)->toBe(ParentChildLinkStatus::Pending);
});
