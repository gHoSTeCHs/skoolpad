<?php

namespace App\Services;

use App\Enums\AccountType;
use App\Enums\ParentalRelationship;
use App\Enums\ParentChildLinkStatus;
use App\Enums\StudentType;
use App\Enums\UserRole;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ParentAccountService
{
    public function createParentProfile(
        User $user,
        ParentalRelationship $relationship,
        ?string $phoneNumber = null,
    ): ParentProfile {
        return ParentProfile::query()->create([
            'user_id' => $user->id,
            'relationship' => $relationship,
            'phone_number' => $phoneNumber,
            'notification_preferences' => [],
        ]);
    }

    /**
     * @param  array<string>  $subjects
     * @return array{user: User, profile: StudentProfile, link: ParentChildLink}
     */
    public function createChildAccount(
        ParentProfile $parentProfile,
        string $childName,
        string $childEmail,
        string $childPassword,
        string $educationLevelId,
        array $subjects = [],
    ): array {
        return DB::transaction(function () use ($parentProfile, $childName, $childEmail, $childPassword, $educationLevelId) {
            $childUser = User::query()->create([
                'name' => $childName,
                'email' => $childEmail,
                'password' => $childPassword,
                'account_type' => AccountType::Student,
                'role' => UserRole::Student,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $childProfile = StudentProfile::query()->create([
                'user_id' => $childUser->id,
                'student_type' => StudentType::Secondary,
                'education_level_id' => $educationLevelId,
            ]);

            // TODO: Enroll child in subjects when subject enrollment service is built
            // foreach ($subjects as $subjectId) { ... }

            $link = ParentChildLink::query()->create([
                'parent_profile_id' => $parentProfile->id,
                'student_profile_id' => $childProfile->id,
                'status' => ParentChildLinkStatus::Active,
                'linked_at' => now(),
                'data_consent_granted_at' => now(),
            ]);

            return [
                'user' => $childUser,
                'profile' => $childProfile,
                'link' => $link,
            ];
        });
    }

    public function linkParentToStudent(ParentProfile $parentProfile, string $inviteCode): ParentChildLink
    {
        $studentProfile = StudentProfile::query()
            ->where('invite_code', $inviteCode)
            ->firstOrFail();

        $existingLink = ParentChildLink::query()
            ->where('parent_profile_id', $parentProfile->id)
            ->where('student_profile_id', $studentProfile->id)
            ->first();

        if ($existingLink) {
            throw ValidationException::withMessages([
                'invite_code' => ['You are already linked to this student.'],
            ]);
        }

        return ParentChildLink::query()->create([
            'parent_profile_id' => $parentProfile->id,
            'student_profile_id' => $studentProfile->id,
            'status' => ParentChildLinkStatus::Pending,
        ]);
    }

    public function approveLinkRequest(StudentProfile $studentProfile, string $linkId): ParentChildLink
    {
        $link = ParentChildLink::query()
            ->where('id', $linkId)
            ->where('student_profile_id', $studentProfile->id)
            ->where('status', ParentChildLinkStatus::Pending)
            ->firstOrFail();

        $link->update([
            'status' => ParentChildLinkStatus::Active,
            'linked_at' => now(),
            'data_consent_granted_at' => now(),
        ]);

        return $link->fresh();
    }

    public function revokeLinkRequest(User $requestingUser, string $linkId): ParentChildLink
    {
        $link = ParentChildLink::query()->findOrFail($linkId);

        $isParentOwner = $requestingUser->parentProfile
            && $link->parent_profile_id === $requestingUser->parentProfile->id;

        $isStudentOwner = $requestingUser->studentProfile
            && $link->student_profile_id === $requestingUser->studentProfile->id;

        if (! $isParentOwner && ! $isStudentOwner) {
            throw new ModelNotFoundException;
        }

        if ($link->status === ParentChildLinkStatus::Revoked) {
            return $link;
        }

        $link->update([
            'status' => ParentChildLinkStatus::Revoked,
        ]);

        return $link->fresh();
    }

    /** @return Collection<int, ParentChildLink> */
    public function getLinkedChildren(ParentProfile $parentProfile): Collection
    {
        return ParentChildLink::query()
            ->where('parent_profile_id', $parentProfile->id)
            ->where('status', ParentChildLinkStatus::Active)
            ->with('studentProfile.user')
            ->get();
    }

    /** @return array{children: Collection, subscription_status: string} */
    public function getParentDashboardSummary(ParentProfile $parentProfile): array
    {
        $children = $this->getLinkedChildren($parentProfile);

        $subscriptionStatus = $parentProfile->user->activeSubscription?->plan?->name ?? 'free';

        return [
            'children' => $children,
            'subscription_status' => strtolower(str_replace(' ', '_', $subscriptionStatus)),
        ];
    }

    public function sendParentInvite(StudentProfile $studentProfile, string $parentEmail): ParentChildLink
    {
        $existingPendingLink = ParentChildLink::query()
            ->where('student_profile_id', $studentProfile->id)
            ->whereNull('parent_profile_id')
            ->where('status', ParentChildLinkStatus::Pending)
            ->first();

        if ($existingPendingLink) {
            return $existingPendingLink;
        }

        return ParentChildLink::query()->create([
            'student_profile_id' => $studentProfile->id,
            'status' => ParentChildLinkStatus::Pending,
        ]);
    }
}
