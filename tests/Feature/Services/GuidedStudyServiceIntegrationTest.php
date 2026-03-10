<?php

use App\Models\CanonicalTopic;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\ExamTimetableEntry;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\StudentProfile;
use App\Services\GuidedStudyService;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->service = app(GuidedStudyService::class);

    $this->system = EducationSystem::factory()->create();
    $this->tier = CurriculumTier::factory()->for($this->system)->create(['is_tertiary' => false]);
    $this->level = EducationLevel::factory()->for($this->tier, 'curriculumTier')->create();
    $this->subject = CurriculumSubject::factory()->create(['education_system_id' => $this->system->id]);
    $this->levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $this->level->id,
        'curriculum_subject_id' => $this->subject->id,
    ]);

    $this->profile = StudentProfile::factory()->secondary()->create([
        'education_system_id' => $this->system->id,
        'education_level_id' => $this->level->id,
    ]);
    $this->user = $this->profile->user;
});

it('includes Tier 0 items when active timetable entries exist', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'canonical_topic_id' => $topic->id,
        'term' => 1,
        'week_number' => 1,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'level_subject_id' => $this->levelSubject->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    $tier0Items = collect($result['items'])->where('priority_tier', 0);
    expect($tier0Items)->not->toBeEmpty();

    Carbon::setTestNow();
});

it('skips Tier 1 spaced rep when planner is active', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'canonical_topic_id' => $topic->id,
        'term' => 1,
        'week_number' => 1,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'level_subject_id' => $this->levelSubject->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    $tier1Items = collect($result['items'])->where('priority_tier', 1);
    expect($tier1Items)->toBeEmpty();

    Carbon::setTestNow();
});

it('operates normally with Tiers 1-4 when no active entries', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'topic_label' => 'Algebra Basics',
        'canonical_topic_id' => $topic->id,
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    $tier0Items = collect($result['items'])->where('priority_tier', 0);
    expect($tier0Items)->toBeEmpty();

    $tier2Items = collect($result['items'])->where('priority_tier', 2);
    expect($tier2Items)->not->toBeEmpty();

    Carbon::setTestNow();
});
