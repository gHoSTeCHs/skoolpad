<?php

use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->institution = Institution::factory()->create();
    $this->faculty = Faculty::factory()->for($this->institution)->create();
    $this->department = Department::factory()->for($this->faculty)->create();

    $this->profile = StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
        'level' => '200L',
    ]);

    $this->actingAs($this->student);
});

test('dashboard renders with student data', function () {
    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('student')
            ->where('student.name', $this->student->name)
            ->where('student.institution', $this->institution->name)
            ->has('courses')
            ->has('stats')
            ->has('suggested_topics')
        );
});

test('dashboard shows enrolled courses with counts', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course->id,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('courses', 1)
            ->where('courses.0.course_code', $course->course_code)
            ->has('courses.0.topic_count')
            ->has('courses.0.question_count')
            ->where('stats.courses_count', 1)
        );
});

test('dashboard excludes archived courses', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);

    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course->id,
        'is_archived' => true,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('courses', 0)
            ->where('stats.courses_count', 0)
        );
});

test('guests cannot access dashboard', function () {
    auth()->logout();

    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('unboarded students cannot access dashboard', function () {
    $newStudent = User::factory()->create();

    $this->actingAs($newStudent)
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding.index'));
});

test('dashboard includes questions_practiced and overall_accuracy stats', function () {
    $course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course->id,
    ]);

    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->student->id,
        'institution_course_id' => $course->id,
        'question_count' => 3,
        'correct_count' => 2,
    ]);

    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'is_correct' => true,
        'time_spent_seconds' => 10,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'is_correct' => true,
        'time_spent_seconds' => 10,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'is_correct' => false,
        'time_spent_seconds' => 10,
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('stats.questions_practiced', 3)
            ->where('stats.overall_accuracy', 67)
        );
});
