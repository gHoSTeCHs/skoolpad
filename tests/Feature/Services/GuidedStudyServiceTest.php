<?php

use App\Models\BlockCompletion;
use App\Models\CalendarTerm;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\Institution;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\StudentProfile;
use App\Models\TopicCompletion;
use App\Models\User;
use App\Services\Student\GuidedStudyService;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->service = app(GuidedStudyService::class);
    $this->user = User::factory()->create();

    $this->system = EducationSystem::factory()->create();
    $this->tier = CurriculumTier::factory()->for($this->system)->create(['is_tertiary' => false]);
    $this->level = EducationLevel::factory()->for($this->tier, 'curriculumTier')->create();
    $this->subject = CurriculumSubject::factory()->create(['education_system_id' => $this->system->id]);
    $this->levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $this->level->id,
        'curriculum_subject_id' => $this->subject->id,
    ]);

    $this->profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->user->id,
        'education_system_id' => $this->system->id,
        'education_level_id' => $this->level->id,
    ]);
});

test('returns empty items when no scheme of work exists', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 15));

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    expect($result['items'])->toBeEmpty()
        ->and($result['daily_goal_minutes'])->toBe(30)
        ->and($result['total_estimated_minutes'])->toBe(0);

    Carbon::setTestNow();
});

test('includes scheme of work items for current term and week', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'topic_label' => 'Quadratic Equations',
        'canonical_topic_id' => $topic->id,
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    expect($result['items'])->toHaveCount(1)
        ->and($result['items'][0]['topic_label'])->toBe('Quadratic Equations')
        ->and($result['items'][0]['priority_tier'])->toBe(2)
        ->and($result['items'][0]['type'])->toBe('study');

    Carbon::setTestNow();
});

test('excludes completed topics from scheme items', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'canonical_topic_id' => $topic->id,
    ]);

    TopicCompletion::factory()->create([
        'user_id' => $this->user->id,
        'canonical_topic_id' => $topic->id,
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    expect($result['items'])->toBeEmpty();

    Carbon::setTestNow();
});

test('excludes completed blocks from scheme items', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $block = ContentBlock::factory()->published()->create(['estimated_read_time' => 8]);
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'content_block_id' => $block->id,
    ]);

    BlockCompletion::factory()->create([
        'user_id' => $this->user->id,
        'content_block_id' => $block->id,
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    expect($result['items'])->toBeEmpty();

    Carbon::setTestNow();
});

test('fills remaining budget with next unread blocks', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'canonical_topic_id' => $topic->id,
    ]);

    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic->id,
        'estimated_read_time' => 5,
        'sort_order' => 1,
        'path' => '1',
    ]);

    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic->id,
        'estimated_read_time' => 5,
        'sort_order' => 2,
        'path' => '2',
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    $tier4Items = collect($result['items'])->where('priority_tier', 4);
    expect($tier4Items)->not->toBeEmpty()
        ->and($tier4Items->first()['type'])->toBe('study');

    Carbon::setTestNow();
});

test('respects daily goal minutes from study preferences', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $this->profile->update(['study_preferences' => ['daily_goal_minutes' => 45]]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile->fresh());

    expect($result['daily_goal_minutes'])->toBe(45);

    Carbon::setTestNow();
});

test('uses default 30 minutes when study preferences missing', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $this->profile->update(['study_preferences' => null]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile->fresh());

    expect($result['daily_goal_minutes'])->toBe(30);

    Carbon::setTestNow();
});

test('resolves term and week from CalendarTerm when available', function () {
    $institution = Institution::factory()->create();
    $this->profile->update(['institution_id' => $institution->id]);

    CalendarTerm::factory()->create([
        'institution_id' => $institution->id,
        'start_date' => '2026-01-05',
        'end_date' => '2026-03-28',
        'sort_order' => 2,
    ]);

    Carbon::setTestNow(Carbon::create(2026, 1, 19));

    $result = $this->service->buildStudyPlan($this->user, $this->profile->fresh());

    expect($result['current_term'])->toBe(2)
        ->and($result['current_week'])->toBe(3);

    Carbon::setTestNow();
});

test('resolves term and week from heuristic when no CalendarTerm', function () {
    Carbon::setTestNow(Carbon::create(2026, 10, 1));

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    expect($result['current_term'])->toBe(1)
        ->and($result['current_week'])->toBe(3);

    Carbon::setTestNow();
});

test('spaced repetition tier returns empty stub', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    $tier1Items = collect($result['items'])->where('priority_tier', 1);
    expect($tier1Items)->toBeEmpty();

    Carbon::setTestNow();
});

test('weak topics tier returns empty stub', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    $tier3Items = collect($result['items'])->where('priority_tier', 3);
    expect($tier3Items)->toBeEmpty();

    Carbon::setTestNow();
});

test('completed_minutes is zero when no scheme items are completed', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'canonical_topic_id' => $topic->id,
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    expect($result['completed_minutes'])->toBe(0);

    Carbon::setTestNow();
});

test('returns completed_minutes summed from skipped completed scheme items', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $topic1 = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->published()->create(['estimated_read_time' => 8]);

    $subject2 = CurriculumSubject::factory()->create(['education_system_id' => $this->system->id]);
    $levelSubject2 = LevelSubject::factory()->create([
        'education_level_id' => $this->level->id,
        'curriculum_subject_id' => $subject2->id,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'canonical_topic_id' => $topic1->id,
        'content_block_id' => null,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject2->id,
        'term' => 2,
        'week_number' => 4,
        'canonical_topic_id' => null,
        'content_block_id' => $block->id,
    ]);

    TopicCompletion::factory()->create([
        'user_id' => $this->user->id,
        'canonical_topic_id' => $topic1->id,
    ]);

    BlockCompletion::factory()->create([
        'user_id' => $this->user->id,
        'content_block_id' => $block->id,
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile);

    expect($result['completed_minutes'])->toBe(10 + 8)
        ->and($result['items'])->toBeEmpty();

    Carbon::setTestNow();
});

test('caps total items to daily goal budget', function () {
    Carbon::setTestNow(Carbon::create(2026, 2, 1));

    $this->profile->update(['study_preferences' => ['daily_goal_minutes' => 15]]);

    $topic = CanonicalTopic::factory()->create();

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 4,
        'topic_label' => 'Item A',
        'canonical_topic_id' => $topic->id,
    ]);

    $subject2 = CurriculumSubject::factory()->create(['education_system_id' => $this->system->id]);
    $levelSubject2 = LevelSubject::factory()->create([
        'education_level_id' => $this->level->id,
        'curriculum_subject_id' => $subject2->id,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject2->id,
        'term' => 2,
        'week_number' => 4,
        'topic_label' => 'Item B',
    ]);

    $subject3 = CurriculumSubject::factory()->create(['education_system_id' => $this->system->id]);
    $levelSubject3 = LevelSubject::factory()->create([
        'education_level_id' => $this->level->id,
        'curriculum_subject_id' => $subject3->id,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject3->id,
        'term' => 2,
        'week_number' => 4,
        'topic_label' => 'Item C',
    ]);

    $result = $this->service->buildStudyPlan($this->user, $this->profile->fresh());

    expect($result['total_estimated_minutes'])->toBeLessThanOrEqual(25);

    Carbon::setTestNow();
});
