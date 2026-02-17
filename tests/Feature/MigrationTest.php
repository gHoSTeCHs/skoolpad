<?php

use Illuminate\Support\Facades\Schema;

test('all expected tables exist after migration', function () {
    $expectedTables = [
        'users',
        'countries',
        'disciplines',
        'institutions',
        'faculties',
        'departments',
        'exam_types',
        'exam_subjects',
        'institution_courses',
        'course_department_offerings',
        'canonical_topics',
        'topic_prerequisites',
        'course_topic_mappings',
        'questions',
        'question_topic_links',
        'question_options',
        'question_answers',
        'practice_sessions',
        'practice_answers',
        'student_notes',
        'content_submissions',
        'spaced_repetition_items',
        'student_profiles',
        'student_courses',
        'topic_completions',
        'contribution_stats',
        'cgpa_simulations',
        'xp_transactions',
        'user_levels',
        'badges',
        'user_badges',
        'leaderboards',
        'study_groups',
        'study_group_members',
        'subscription_plans',
        'user_subscriptions',
        'payment_transactions',
        'platform_settings',
        'user_preferences',
    ];

    foreach ($expectedTables as $table) {
        expect(Schema::hasTable($table))->toBeTrue("Table '{$table}' should exist");
    }
});
