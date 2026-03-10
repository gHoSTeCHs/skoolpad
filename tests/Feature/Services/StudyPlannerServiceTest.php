<?php

use App\Enums\SpacedRepetitionStatus;
use App\Enums\TopicWeight;
use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\CurriculumSubject;
use App\Models\CurriculumTier;
use App\Models\EducationLevel;
use App\Models\EducationSystem;
use App\Models\ExamTimetableEntry;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionTopicLink;
use App\Models\SchemeOfWorkItem;
use App\Models\SpacedRepetitionItem;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Services\StudyPlannerService;

beforeEach(function () {
    $this->service = app(StudyPlannerService::class);

    $this->profile = StudentProfile::factory()->create();
    $this->user = $this->profile->user;

    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);

    $this->topicA = CanonicalTopic::factory()->create(['title' => 'Topic A']);
    $this->topicB = CanonicalTopic::factory()->create(['title' => 'Topic B']);
    $this->topicC = CanonicalTopic::factory()->create(['title' => 'Topic C']);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topicA->id,
        'sequence_order' => 1,
        'weight' => TopicWeight::Core,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topicB->id,
        'sequence_order' => 2,
        'weight' => TopicWeight::Core,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topicC->id,
        'sequence_order' => 3,
        'weight' => TopicWeight::Supplementary,
    ]);
});

it('returns null when no active entries', function () {
    $result = $this->service->buildDailyPlan($this->user, $this->profile);

    expect($result)->toBeNull();
});

it('returns plan items for tertiary entry', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);

    expect($result)->not->toBeNull()
        ->and($result['items'])->not->toBeEmpty()
        ->and($result['exam_breakdown'])->toHaveCount(1);
});

it('returns plan items for secondary entry', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->create(['education_system_id' => $system->id]);

    $secondaryProfile = StudentProfile::factory()->secondary()->create([
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);
    $secondaryUser = $secondaryProfile->user;

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'canonical_topic_id' => $topic->id,
        'term' => 1,
        'week_number' => 1,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $secondaryUser->id,
        'level_subject_id' => $levelSubject->id,
        'exam_date' => now()->addDays(10),
    ]);

    $result = $this->service->buildDailyPlan($secondaryUser, $secondaryProfile);

    expect($result)->not->toBeNull()
        ->and($result['items'])->not->toBeEmpty();
});

it('allocates more time to imminent exams via urgency weighting', function () {
    $course2 = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course2->id,
    ]);
    $topicD = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $course2->id,
        'canonical_topic_id' => $topicD->id,
        'sequence_order' => 1,
        'weight' => TopicWeight::Core,
    ]);

    $imminentEntry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDay(),
    ]);

    $distantEntry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $course2->id,
        'exam_date' => now()->addDays(30),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $breakdown = collect($result['exam_breakdown']);

    $imminentBreakdown = $breakdown->firstWhere('entry_id', $imminentEntry->id);
    $distantBreakdown = $breakdown->firstWhere('entry_id', $distantEntry->id);

    expect($imminentBreakdown['allocated_minutes'])->toBeGreaterThan($distantBreakdown['allocated_minutes']);
});

it('applies AOC partition when AOC topics set', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);
    $entry->aocTopics()->sync([$this->topicA->id]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $examPrepItems = collect($result['items'])->where('type', 'exam_prep');

    expect($examPrepItems)->not->toBeEmpty();

    $aocItems = $examPrepItems->filter(fn ($i) => $i['topic_id'] === $this->topicA->id);
    expect($aocItems)->not->toBeEmpty();
});

it('returns no exam_prep items when all AOC topics are strong', function () {
    $session = PracticeSession::factory()->create(['user_id' => $this->user->id]);

    foreach ([$this->topicA, $this->topicB, $this->topicC] as $topic) {
        $block = ContentBlock::factory()->published()->create([
            'canonical_topic_id' => $topic->id,
            'sort_order' => 1,
            'path' => '1',
        ]);
        BlockCompletion::factory()->create([
            'user_id' => $this->user->id,
            'content_block_id' => $block->id,
        ]);

        $question = Question::factory()->create(['institution_course_id' => $this->course->id]);
        QuestionTopicLink::factory()->create([
            'question_id' => $question->id,
            'canonical_topic_id' => $topic->id,
        ]);
        for ($i = 0; $i < 10; $i++) {
            PracticeAnswer::factory()->create([
                'practice_session_id' => $session->id,
                'question_id' => $question->id,
                'is_correct' => true,
            ]);
        }
    }

    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);
    $entry->aocTopics()->sync([$this->topicA->id, $this->topicB->id]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $examPrepItems = collect($result['items'])->where('type', 'exam_prep');

    expect($examPrepItems)->toBeEmpty();
});

it('treats all topics equally when no AOC set', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $examPrepItems = collect($result['items'])->where('type', 'exam_prep');

    expect($examPrepItems)->not->toBeEmpty();
});

it('prioritizes not_started topics with read action for unread', function () {
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topicA->id,
        'sort_order' => 1,
        'path' => '1',
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $examPrepItems = collect($result['items'])->where('type', 'exam_prep');
    $firstItem = $examPrepItems->first();

    expect($firstItem['action'])->toBe('read');
});

it('generates practice action for weak topics', function () {
    $session = PracticeSession::factory()->create(['user_id' => $this->user->id]);
    $question = Question::factory()->create(['institution_course_id' => $this->course->id]);
    QuestionTopicLink::factory()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $this->topicA->id,
    ]);

    for ($i = 0; $i < 5; $i++) {
        PracticeAnswer::factory()->create([
            'practice_session_id' => $session->id,
            'question_id' => $question->id,
            'is_correct' => false,
        ]);
    }

    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topicA->id,
        'sort_order' => 1,
        'path' => '1',
    ]);
    BlockCompletion::factory()->create([
        'user_id' => $this->user->id,
        'content_block_id' => ContentBlock::query()->where('canonical_topic_id', $this->topicA->id)->first()->id,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $topicAItems = collect($result['items'])->where('topic_id', $this->topicA->id);

    expect($topicAItems)->not->toBeEmpty();
    $practiceItem = $topicAItems->firstWhere('action', 'practice');
    expect($practiceItem)->not->toBeNull();
});

it('skips strong topics with accuracy >= 80%', function () {
    $session = PracticeSession::factory()->create(['user_id' => $this->user->id]);
    $question = Question::factory()->create(['institution_course_id' => $this->course->id]);
    QuestionTopicLink::factory()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $this->topicA->id,
    ]);

    for ($i = 0; $i < 10; $i++) {
        PracticeAnswer::factory()->create([
            'practice_session_id' => $session->id,
            'question_id' => $question->id,
            'is_correct' => true,
        ]);
    }

    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topicA->id,
        'sort_order' => 1,
        'path' => '1',
    ]);
    BlockCompletion::factory()->create([
        'user_id' => $this->user->id,
        'content_block_id' => ContentBlock::query()->where('canonical_topic_id', $this->topicA->id)->first()->id,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $topicAItems = collect($result['items'])->filter(fn ($i) => $i['topic_id'] === $this->topicA->id && $i['type'] === 'exam_prep');

    expect($topicAItems)->toBeEmpty();
});

it('prepends spaced rep items at priority 0', function () {
    $question = Question::factory()->create(['institution_course_id' => $this->course->id]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $question->id,
        'next_review_at' => now()->subDay()->toDateString(),
        'status' => SpacedRepetitionStatus::Active,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);
    $reviewItems = collect($result['items'])->where('type', 'review');

    expect($reviewItems)->not->toBeEmpty();
    expect($reviewItems->first()['priority'])->toBe(0);
    expect($reviewItems->first()['action'])->toBe('review');
});

it('caps budget at 180 minutes', function () {
    $this->profile->update(['study_preferences' => ['daily_goal_minutes' => 100]]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDay(),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile->fresh());

    expect($result['total_minutes'])->toBeLessThanOrEqual(180);
});

it('skips entries with no resolvable topics', function () {
    $emptyCoures = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $emptyCoures->id,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $emptyCoures->id,
        'exam_date' => now()->addDays(5),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);

    $breakdown = collect($result['exam_breakdown']);
    expect($breakdown->first()['allocated_minutes'])->toBe(0);
});

it('distributes time across multiple exams by urgency', function () {
    $course2 = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $course2->id,
    ]);
    $topicD = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $course2->id,
        'canonical_topic_id' => $topicD->id,
        'sequence_order' => 1,
        'weight' => TopicWeight::Core,
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(3),
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $course2->id,
        'exam_date' => now()->addDays(10),
    ]);

    $result = $this->service->buildDailyPlan($this->user, $this->profile);

    expect($result['exam_breakdown'])->toHaveCount(2);
});

it('returns correct readiness for tertiary entry with CourseTopicMapping', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $readiness = $this->service->getTopicReadiness($this->user, $entry);

    expect($readiness)->toHaveCount(3);
    expect(collect($readiness)->pluck('topic_id'))->toContain($this->topicA->id, $this->topicB->id, $this->topicC->id);
});

it('returns correct readiness for secondary entry with SchemeOfWorkItem', function () {
    $system = EducationSystem::factory()->create();
    $tier = CurriculumTier::factory()->for($system)->create(['is_tertiary' => false]);
    $level = EducationLevel::factory()->for($tier, 'curriculumTier')->create();
    $subject = CurriculumSubject::factory()->create(['education_system_id' => $system->id]);

    $secondaryProfile = StudentProfile::factory()->secondary()->create([
        'education_system_id' => $system->id,
        'education_level_id' => $level->id,
    ]);
    $secondaryUser = $secondaryProfile->user;

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $level->id,
        'curriculum_subject_id' => $subject->id,
    ]);

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'canonical_topic_id' => $topic->id,
        'term' => 1,
        'week_number' => 1,
    ]);

    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $secondaryUser->id,
        'level_subject_id' => $levelSubject->id,
        'exam_date' => now()->addDays(10),
    ]);

    $readiness = $this->service->getTopicReadiness($secondaryUser, $entry);

    expect($readiness)->toHaveCount(1);
    expect($readiness[0]['topic_id'])->toBe($topic->id);
});

it('flags AOC topics with is_aoc true', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);
    $entry->aocTopics()->sync([$this->topicA->id]);

    $readiness = $this->service->getTopicReadiness($this->user, $entry);
    $topicAReadiness = collect($readiness)->firstWhere('topic_id', $this->topicA->id);
    $topicBReadiness = collect($readiness)->firstWhere('topic_id', $this->topicB->id);

    expect($topicAReadiness['is_aoc'])->toBeTrue();
    expect($topicBReadiness['is_aoc'])->toBeFalse();
});

it('classifies all 5 readiness statuses correctly', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $readiness = $this->service->getTopicReadiness($this->user, $entry);
    expect(collect($readiness)->firstWhere('topic_id', $this->topicA->id)['status'])->toBe('not_started');

    $blockA = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topicA->id,
        'sort_order' => 1,
        'path' => '1',
    ]);
    BlockCompletion::factory()->create([
        'user_id' => $this->user->id,
        'content_block_id' => $blockA->id,
    ]);

    $readiness = $this->service->getTopicReadiness($this->user, $entry);
    expect(collect($readiness)->firstWhere('topic_id', $this->topicA->id)['status'])->toBe('read_only');

    $session = PracticeSession::factory()->create(['user_id' => $this->user->id]);

    $questionA = Question::factory()->create(['institution_course_id' => $this->course->id]);
    QuestionTopicLink::factory()->create([
        'question_id' => $questionA->id,
        'canonical_topic_id' => $this->topicA->id,
    ]);
    for ($i = 0; $i < 5; $i++) {
        PracticeAnswer::factory()->create([
            'practice_session_id' => $session->id,
            'question_id' => $questionA->id,
            'is_correct' => false,
        ]);
    }
    $readiness = $this->service->getTopicReadiness($this->user, $entry);
    expect(collect($readiness)->firstWhere('topic_id', $this->topicA->id)['status'])->toBe('weak');

    $questionB = Question::factory()->create(['institution_course_id' => $this->course->id]);
    QuestionTopicLink::factory()->create([
        'question_id' => $questionB->id,
        'canonical_topic_id' => $this->topicB->id,
    ]);
    for ($i = 0; $i < 10; $i++) {
        PracticeAnswer::factory()->create([
            'practice_session_id' => $session->id,
            'question_id' => $questionB->id,
            'is_correct' => $i < 7,
        ]);
    }
    $readiness = $this->service->getTopicReadiness($this->user, $entry);
    expect(collect($readiness)->firstWhere('topic_id', $this->topicB->id)['status'])->toBe('developing');

    $questionC = Question::factory()->create(['institution_course_id' => $this->course->id]);
    QuestionTopicLink::factory()->create([
        'question_id' => $questionC->id,
        'canonical_topic_id' => $this->topicC->id,
    ]);
    for ($i = 0; $i < 10; $i++) {
        PracticeAnswer::factory()->create([
            'practice_session_id' => $session->id,
            'question_id' => $questionC->id,
            'is_correct' => $i < 9,
        ]);
    }
    $readiness = $this->service->getTopicReadiness($this->user, $entry);
    expect(collect($readiness)->firstWhere('topic_id', $this->topicC->id)['status'])->toBe('strong');
});

it('returns 2.5x for imminent exams at most 2 days away', function () {
    $this->profile->update(['study_preferences' => ['daily_goal_minutes' => 40]]);
    $entries = collect([
        ExamTimetableEntry::factory()->create([
            'user_id' => $this->user->id,
            'institution_course_id' => $this->course->id,
            'exam_date' => now()->addDay(),
        ]),
    ]);

    $budget = $this->service->getAdaptiveTimeBudget($this->profile->fresh(), $entries);

    expect($budget['total_minutes'])->toBe(100)
        ->and($budget['baseline_minutes'])->toBe(40)
        ->and($budget['reason'])->toContain('intensive');
});

it('returns 1.5x for upcoming exams 3-7 days away', function () {
    $this->profile->update(['study_preferences' => ['daily_goal_minutes' => 40]]);
    $entries = collect([
        ExamTimetableEntry::factory()->create([
            'user_id' => $this->user->id,
            'institution_course_id' => $this->course->id,
            'exam_date' => now()->addDays(5),
        ]),
    ]);

    $budget = $this->service->getAdaptiveTimeBudget($this->profile->fresh(), $entries);

    expect($budget['total_minutes'])->toBe(60)
        ->and($budget['baseline_minutes'])->toBe(40)
        ->and($budget['reason'])->toContain('ramping');
});

it('returns 1.0x for distant exams 8+ days away', function () {
    $this->profile->update(['study_preferences' => ['daily_goal_minutes' => 40]]);
    $entries = collect([
        ExamTimetableEntry::factory()->create([
            'user_id' => $this->user->id,
            'institution_course_id' => $this->course->id,
            'exam_date' => now()->addDays(15),
        ]),
    ]);

    $budget = $this->service->getAdaptiveTimeBudget($this->profile->fresh(), $entries);

    expect($budget['total_minutes'])->toBe(40)
        ->and($budget['baseline_minutes'])->toBe(40)
        ->and($budget['reason'])->toBe('Standard study pace');
});

it('caps at 180 when multiplied budget exceeds max', function () {
    $this->profile->update(['study_preferences' => ['daily_goal_minutes' => 100]]);
    $entries = collect([
        ExamTimetableEntry::factory()->create([
            'user_id' => $this->user->id,
            'institution_course_id' => $this->course->id,
            'exam_date' => now()->addDay(),
        ]),
    ]);

    $budget = $this->service->getAdaptiveTimeBudget($this->profile->fresh(), $entries);

    expect($budget['total_minutes'])->toBe(180)
        ->and($budget['baseline_minutes'])->toBe(100);
});

it('uses default 30 when no study preferences set', function () {
    $this->profile->update(['study_preferences' => null]);
    $entries = collect([
        ExamTimetableEntry::factory()->create([
            'user_id' => $this->user->id,
            'institution_course_id' => $this->course->id,
            'exam_date' => now()->addDay(),
        ]),
    ]);

    $budget = $this->service->getAdaptiveTimeBudget($this->profile->fresh(), $entries);

    expect($budget['total_minutes'])->toBe(75)
        ->and($budget['baseline_minutes'])->toBe(30);
});

it('returns next exam and counts from getExamSummary', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $summary = $this->service->getExamSummary($this->user, $this->profile);

    expect($summary['next_exam'])->not->toBeNull()
        ->and($summary['total_active'])->toBe(1)
        ->and($summary['recommended_minutes'])->toBeGreaterThan(0);
});

it('returns null next_exam when no active entries', function () {
    $summary = $this->service->getExamSummary($this->user, $this->profile);

    expect($summary['next_exam'])->toBeNull()
        ->and($summary['total_active'])->toBe(0)
        ->and($summary['total_weak_topics'])->toBe(0)
        ->and($summary['recommended_minutes'])->toBe(0);
});

it('returns papers matching assessment type for getAvailablePapers', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => null,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    $paper = \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $assessmentType->id,
    ]);
    \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => \App\Models\AssessmentType::factory()->create()->id,
    ]);

    $result = $this->service->getAvailablePapers($entry);

    expect($result)->toHaveCount(1)
        ->and($result->first()->id)->toBe($paper->id);
});

it('filters papers by institution course when set for getAvailablePapers', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    $matchingPaper = \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $assessmentType->id,
        'institution_course_id' => $this->course->id,
    ]);
    \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $assessmentType->id,
        'institution_course_id' => \App\Models\InstitutionCourse::factory()->create()->id,
    ]);

    $result = $this->service->getAvailablePapers($entry);

    expect($result)->toHaveCount(1)
        ->and($result->first()->id)->toBe($matchingPaper->id);
});

it('returns empty collection for entry without assessment type', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(10),
    ]);

    $result = $this->service->getAvailablePapers($entry);

    expect($result)->toBeEmpty();
});

it('creates FullMock session from paper for createMockSession', function () {
    $assessmentType = \App\Models\AssessmentType::factory()->create();
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'assessment_type_id' => $assessmentType->id,
        'exam_date' => now()->addDays(10),
    ]);

    $paper = \App\Models\QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $assessmentType->id,
        'institution_course_id' => $this->course->id,
        'duration_minutes' => 60,
    ]);

    $q1 = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'institution_course_id' => $this->course->id,
    ]);
    $q2 = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'institution_course_id' => $this->course->id,
    ]);

    $session = $this->service->createMockSession($this->user, $entry, $paper);

    expect($session->mode)->toBe(\App\Enums\PracticeMode::FullMock)
        ->and($session->question_paper_id)->toBe($paper->id)
        ->and($session->assessment_type_id)->toBe($assessmentType->id)
        ->and($session->question_count)->toBe(2)
        ->and($session->time_limit_seconds)->toBe(3600);
});

it('returns grade and next target for getPredictiveScore', function () {
    $scale = \App\Models\GradingScale::factory()->create([
        'grade_boundaries' => [
            ['label' => 'A1', 'min' => 75, 'max' => 100, 'is_pass' => true],
            ['label' => 'B2', 'min' => 70, 'max' => 74.9, 'is_pass' => true],
            ['label' => 'C4', 'min' => 60, 'max' => 69.9, 'is_pass' => true],
            ['label' => 'F9', 'min' => 0, 'max' => 39.9, 'is_pass' => false],
        ],
        'pass_threshold' => 40,
    ]);
    $assessmentType = \App\Models\AssessmentType::factory()->create([
        'grading_scale_id' => $scale->id,
    ]);

    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'mode' => \App\Enums\PracticeMode::FullMock,
        'assessment_type_id' => $assessmentType->id,
        'question_count' => 10,
        'correct_count' => 6,
        'score_percentage' => 60.0,
    ]);

    $result = $this->service->getPredictiveScore($session);

    expect($result)->not->toBeNull()
        ->and($result['grade'])->toBe('C4')
        ->and($result['is_passing'])->toBeTrue()
        ->and($result['next_grade'])->toBe('B2');
});

it('returns null for getPredictiveScore without assessment type', function () {
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => null,
    ]);

    $result = $this->service->getPredictiveScore($session);

    expect($result)->toBeNull();
});

it('includes focus topics from AOC in getExamSummary', function () {
    $entry = ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(3),
    ]);
    $entry->aocTopics()->sync([$this->topicA->id, $this->topicB->id]);

    $summary = $this->service->getExamSummary($this->user, $this->profile);

    expect($summary['focus_topics'])->not->toBeEmpty()
        ->and($summary['focus_topics'])->toContain('Topic A');
});

it('includes weakest topics when no AOC in getExamSummary', function () {
    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(3),
    ]);

    $summary = $this->service->getExamSummary($this->user, $this->profile);

    expect($summary['focus_topics'])->not->toBeEmpty()
        ->and(count($summary['focus_topics']))->toBeLessThanOrEqual(3);
});
