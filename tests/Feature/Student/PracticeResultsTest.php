<?php

use App\Models\ExamTimetableEntry;
use App\Models\InstitutionCourse;
use App\Models\PracticeSession;
use App\Models\StudentCourse;
use App\Models\StudentProfile;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->profile = StudentProfile::factory()->create();
    $this->user = $this->profile->user;
    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);

    $this->actingAs($this->user);
});

it('includes has_active_exams true when active exams exist in results', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'completed_at' => now(),
        'question_count' => 5,
        'correct_count' => 3,
    ]);

    $response = $this->get(route('practice.results', $session));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('hasActiveExams', true)
        );
});

it('includes has_active_exams false when no active exams in results', function () {
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'completed_at' => now(),
        'question_count' => 5,
        'correct_count' => 3,
    ]);

    $response = $this->get(route('practice.results', $session));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('hasActiveExams', false)
        );
});
