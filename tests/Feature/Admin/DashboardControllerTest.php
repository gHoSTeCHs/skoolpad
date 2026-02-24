<?php

use App\Enums\QuestionStatus;
use App\Models\CanonicalTopic;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays dashboard with all metric props', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('user_metrics')
            ->has('content_metrics')
            ->has('active_users')
            ->has('practice_metrics')
        );
});

test('index returns correct user counts', function () {
    User::factory()->count(3)->create();
    User::factory()->contentManager()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('user_metrics.total_users', 5)
            ->where('user_metrics.total_students', 3)
            ->where('user_metrics.total_staff', 2)
        );
});

test('index returns correct content counts', function () {
    $institution = Institution::factory()->create();
    $course = InstitutionCourse::factory()->create(['institution_id' => $institution->id]);
    Question::factory()->count(2)->create(['status' => QuestionStatus::Published, 'institution_course_id' => $course->id]);
    Question::factory()->count(3)->create(['status' => QuestionStatus::Draft, 'institution_course_id' => $course->id]);
    Question::factory()->create(['status' => QuestionStatus::InReview, 'institution_course_id' => $course->id]);
    CanonicalTopic::factory()->count(4)->create(['is_published' => true]);
    CanonicalTopic::factory()->count(2)->create(['is_published' => false]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('content_metrics.total_questions', 6)
            ->where('content_metrics.published_questions', 2)
            ->where('content_metrics.draft_questions', 3)
            ->where('content_metrics.in_review_questions', 1)
            ->where('content_metrics.total_topics', 6)
            ->where('content_metrics.published_topics', 4)
            ->where('content_metrics.courses_with_questions', 1)
        );
});

test('index returns active user metrics', function () {
    User::factory()->create(['last_login_at' => now()]);
    User::factory()->create(['last_login_at' => now()->subDays(3)]);
    User::factory()->create(['last_login_at' => now()->subDays(15)]);
    User::factory()->create(['last_login_at' => now()->subDays(60)]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('active_users.dau', 1)
            ->where('active_users.wau', 2)
            ->where('active_users.mau', 3)
        );
});

test('index returns registrations trend with 14 data points', function () {
    User::factory()->create(['created_at' => now()->subDays(2)]);
    User::factory()->create(['created_at' => now()->subDays(2)]);
    User::factory()->create(['created_at' => now()]);

    $this->actingAs($this->admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('user_metrics.registrations_trend', 14)
        );
});

test('guests cannot access dashboard', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});
