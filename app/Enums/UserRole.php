<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case ContentManager = 'content_manager';
    case InstitutionModerator = 'institution_moderator';
    case ContentReviewer = 'content_reviewer';
    case CommunityModerator = 'community_moderator';
    case Student = 'student';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::ContentManager => 'Content Manager',
            self::InstitutionModerator => 'Institution Moderator',
            self::ContentReviewer => 'Content Reviewer',
            self::CommunityModerator => 'Community Moderator',
            self::Student => 'Student',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Platform owner with full system access. Manages all content, users, institutions, settings, and has complete visibility across the entire platform.',
            self::ContentManager => 'Can author, edit, and publish all content across all institutions. Manages canonical topics, questions, answers, and course mappings platform-wide.',
            self::InstitutionModerator => 'Scoped to a specific institution. Can add course mappings, submit and review questions for their assigned institution only.',
            self::ContentReviewer => 'Can review and approve/reject submitted content (questions, corrections, topic suggestions) but cannot author new content.',
            self::CommunityModerator => 'Manages social features, flags inappropriate content, handles user reports. For Phase 3 social features.',
            self::Student => 'Default user role. Can access content, practice questions, take notes, track progress, and submit content for review.',
        };
    }

    public function level(): int
    {
        return match ($this) {
            self::SuperAdmin => 999,
            self::ContentManager => 100,
            self::InstitutionModerator => 70,
            self::ContentReviewer => 60,
            self::CommunityModerator => 50,
            self::Student => 10,
        };
    }

    /** @return list<string> */
    public function permissions(): array
    {
        return match ($this) {
            self::SuperAdmin => [
                'manage_platform_settings',
                'manage_all_users',
                'manage_roles',
                'manage_institutions',
                'manage_faculties',
                'manage_departments',
                'manage_disciplines',
                'manage_canonical_topics',
                'manage_courses',
                'manage_course_mappings',
                'manage_questions',
                'manage_answers',
                'manage_exam_types',
                'publish_content',
                'review_submissions',
                'manage_subscriptions',
                'manage_study_groups',
                'view_all_analytics',
                'view_financial_analytics',
                'manage_bulk_imports',
                'toggle_monetization',
                'impersonate_users',
            ],
            self::ContentManager => [
                'manage_canonical_topics',
                'manage_courses',
                'manage_course_mappings',
                'manage_questions',
                'manage_answers',
                'publish_content',
                'review_submissions',
                'manage_bulk_imports',
                'view_content_analytics',
            ],
            self::InstitutionModerator => [
                'manage_scoped_courses',
                'manage_scoped_course_mappings',
                'submit_questions',
                'manage_scoped_questions',
                'review_scoped_submissions',
                'view_scoped_analytics',
            ],
            self::ContentReviewer => [
                'review_submissions',
                'view_content_analytics',
            ],
            self::CommunityModerator => [
                'manage_reported_content',
                'manage_user_flags',
                'view_community_analytics',
            ],
            self::Student => [
                'view_content',
                'practice_questions',
                'manage_own_notes',
                'manage_own_profile',
                'track_own_progress',
                'submit_content',
                'view_own_analytics',
            ],
        };
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions());
    }

    public function isAdmin(): bool
    {
        return $this === self::SuperAdmin;
    }

    public function isStaff(): bool
    {
        return in_array($this, [
            self::SuperAdmin,
            self::ContentManager,
            self::InstitutionModerator,
            self::ContentReviewer,
            self::CommunityModerator,
        ]);
    }

    /** @return list<self> */
    public static function staffRoles(): array
    {
        return [
            self::ContentManager,
            self::InstitutionModerator,
            self::ContentReviewer,
            self::CommunityModerator,
        ];
    }

    /** @return array<string, string> */
    public static function forAdminSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn ($role) => [$role->value => $role->label()])
            ->toArray();
    }

    /** @return array<string, string> */
    public static function forStaffSelect(): array
    {
        return collect(self::staffRoles())
            ->mapWithKeys(fn ($role) => [$role->value => $role->label()])
            ->toArray();
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $case) => $case->value, self::cases());
    }
}
