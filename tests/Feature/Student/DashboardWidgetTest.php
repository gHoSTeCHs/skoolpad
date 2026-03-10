<?php

use App\Enums\TopicWeight;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\ExamTimetableEntry;
use App\Models\InstitutionCourse;
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

    $topic = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic->id,
        'sequence_order' => 1,
        'weight' => TopicWeight::Core,
    ]);

    $this->actingAs($this->user);
});

it('shows timetable widget with next exam for tertiary student', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('exam_timetable_card')
            ->where('exam_timetable_card.total_active', 1)
            ->has('exam_timetable_card.next_exam')
            ->has('exam_timetable_card.focus_topics')
        );
});

it('shows timetable widget with next exam for secondary student', function () {
    $system = \App\Models\EducationSystem::factory()->create();
    $tier = \App\Models\CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = \App\Models\EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = \App\Models\CurriculumSubject::factory()->create(['education_system_id' => $system->id]);

    $secondaryProfile = StudentProfile::factory()->secondary()->create([
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);
    $secondaryUser = $secondaryProfile->user;

    $levelSubject = \App\Models\LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $topic = CanonicalTopic::factory()->create();
    \App\Models\SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'canonical_topic_id' => $topic->id,
        'term' => 1,
        'week_number' => 1,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $secondaryUser->id,
        'level_subject_id' => $levelSubject->id,
        'exam_date' => now()->addDays(5),
    ]);

    $this->actingAs($secondaryUser);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('exam_timetable_card')
            ->where('exam_timetable_card.total_active', 1)
        );
});

it('shows setup CTA when no timetable entries on dashboard', function () {
    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('exam_timetable_card', null)
        );
});

it('does not include old exam prep card on dashboard', function () {
    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->missing('exam_prep_card')
        );
});
