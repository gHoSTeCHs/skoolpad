<?php

use App\Enums\PracticeMode;
use App\Enums\TopicWeight;
use App\Models\AssessmentType;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\ExamGoal;
use App\Models\GradingScale;
use App\Models\InstitutionCourse;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
use App\Models\QuestionTopicLink;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Services\ExamPrepService;

beforeEach(function () {
    $this->service = app(ExamPrepService::class);
    $this->profile = StudentProfile::factory()->create();
    $this->user = $this->profile->user;
    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);

    $this->gradingScale = GradingScale::factory()->create([
        'pass_threshold' => 50,
        'grade_boundaries' => [
            ['label' => 'A1', 'min' => 75, 'max' => 100, 'is_pass' => true],
            ['label' => 'B2', 'min' => 70, 'max' => 74, 'is_pass' => true],
            ['label' => 'B3', 'min' => 65, 'max' => 69, 'is_pass' => true],
            ['label' => 'C4', 'min' => 60, 'max' => 64, 'is_pass' => true],
            ['label' => 'C5', 'min' => 55, 'max' => 59, 'is_pass' => true],
            ['label' => 'C6', 'min' => 50, 'max' => 54, 'is_pass' => true],
            ['label' => 'D7', 'min' => 40, 'max' => 49, 'is_pass' => false],
            ['label' => 'F9', 'min' => 0, 'max' => 39, 'is_pass' => false],
        ],
    ]);

    $this->assessmentType = AssessmentType::factory()->create([
        'grading_scale_id' => $this->gradingScale->id,
    ]);

    $this->goal = ExamGoal::factory()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(14),
    ]);
});

it('returns only active exam goals for user', function () {
    ExamGoal::factory()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
        'is_active' => true,
    ]);

    ExamGoal::factory()->inactive()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
    ]);

    $result = $this->service->getActiveGoals($this->user);

    expect($result)->toHaveCount(2);
    expect($result->every(fn ($goal) => $goal->is_active === true))->toBeTrue();
});

it('returns available published papers for assessment type', function () {
    QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
    ]);
    QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
    ]);
    QuestionPaper::factory()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'is_published' => false,
    ]);

    $result = $this->service->getAvailablePapers($this->assessmentType);

    expect($result)->toHaveCount(2);
});

it('filters papers by course when provided', function () {
    $otherCourse = InstitutionCourse::factory()->create();

    QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
    ]);
    QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $otherCourse->id,
    ]);

    $result = $this->service->getAvailablePapers($this->assessmentType, $this->course);

    expect($result)->toHaveCount(1);
    expect($result->first()->institution_course_id)->toBe($this->course->id);
});

it('creates mock session with correct mode and paper', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
        'duration_minutes' => 120,
    ]);
    Question::factory()->count(5)->create([
        'question_paper_id' => $paper->id,
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);

    $session = $this->service->createMockSession($this->user, $paper);

    expect($session->mode)->toBe(PracticeMode::FullMock);
    expect($session->question_paper_id)->toBe($paper->id);
    expect($session->assessment_type_id)->toBe($this->assessmentType->id);
    expect($session->institution_course_id)->toBe($this->course->id);
    expect($session->question_count)->toBe(5);
    expect($session->correct_count)->toBe(0);
    expect($session->is_resumable)->toBeTrue();
});

it('creates mock session with questions in section order', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
    ]);

    $sectionA = QuestionSection::factory()->create([
        'question_paper_id' => $paper->id,
        'sort_order' => 1,
    ]);
    $sectionB = QuestionSection::factory()->create([
        'question_paper_id' => $paper->id,
        'sort_order' => 2,
    ]);

    $q3 = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $sectionB->id,
        'sort_order' => 1,
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    $q1 = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $sectionA->id,
        'sort_order' => 1,
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    $q2 = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $sectionA->id,
        'sort_order' => 2,
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);

    $session = $this->service->createMockSession($this->user, $paper);

    expect($session->question_ids)->toBe([$q1->id, $q2->id, $q3->id]);
});

it('sets time limit from paper duration', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
        'duration_minutes' => 60,
    ]);
    Question::factory()->create([
        'question_paper_id' => $paper->id,
        'institution_course_id' => $this->course->id,
    ]);

    $session = $this->service->createMockSession($this->user, $paper);

    expect($session->time_limit_seconds)->toBe(3600);
});

it('maps score percentage to correct grade boundary', function () {
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
        'score_percentage' => 72,
    ]);

    $result = $this->service->getPredictiveScore($session);

    expect($result['percentage'])->toBe(72.0);
    expect($result['grade'])->toBe('B2');
});

it('identifies passing score correctly', function () {
    $passingSession = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
        'score_percentage' => 55,
    ]);

    $failingSession = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
        'score_percentage' => 35,
    ]);

    $passingResult = $this->service->getPredictiveScore($passingSession);
    $failingResult = $this->service->getPredictiveScore($failingSession);

    expect($passingResult['is_passing'])->toBeTrue();
    expect($passingResult['grade'])->toBe('C5');
    expect($failingResult['is_passing'])->toBeFalse();
    expect($failingResult['grade'])->toBe('F9');
});

it('calculates points to next grade', function () {
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
        'score_percentage' => 72,
    ]);

    $result = $this->service->getPredictiveScore($session);

    expect($result['next_grade'])->toBe('A1');
    expect($result['points_to_next'])->toBe(3.0);
});

it('returns null predictive score when no assessment type', function () {
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => null,
        'score_percentage' => 72,
    ]);

    $result = $this->service->getPredictiveScore($session);

    expect($result)->toBeNull();
});

it('identifies weak topics below 70% threshold', function () {
    $topicWeak = CanonicalTopic::factory()->create(['title' => 'Weak Topic']);
    $topicStrong = CanonicalTopic::factory()->create(['title' => 'Strong Topic']);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topicWeak->id,
        'sequence_order' => 1,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topicStrong->id,
        'sequence_order' => 2,
    ]);

    $weakQuestion = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    QuestionTopicLink::factory()->create([
        'question_id' => $weakQuestion->id,
        'canonical_topic_id' => $topicWeak->id,
    ]);

    $strongQuestion = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    QuestionTopicLink::factory()->create([
        'question_id' => $strongQuestion->id,
        'canonical_topic_id' => $topicStrong->id,
    ]);

    $session = PracticeSession::factory()->create(['user_id' => $this->user->id]);

    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $weakQuestion->id,
        'is_correct' => true,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $weakQuestion->id,
        'is_correct' => false,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $weakQuestion->id,
        'is_correct' => false,
    ]);

    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $strongQuestion->id,
        'is_correct' => true,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $strongQuestion->id,
        'is_correct' => true,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $strongQuestion->id,
        'is_correct' => true,
    ]);

    $result = $this->service->getTopicGaps($this->user, $this->goal);

    expect($result)->toHaveCount(1);
    expect($result->first()['title'])->toBe('Weak Topic');
    expect($result->first()['accuracy'])->toBeLessThan(70);
});

it('generates daily plan distributing topics across remaining days', function () {
    $topics = [];
    for ($i = 1; $i <= 7; $i++) {
        $topic = CanonicalTopic::factory()->create(['title' => "Topic {$i}"]);
        CourseTopicMapping::factory()->create([
            'institution_course_id' => $this->course->id,
            'canonical_topic_id' => $topic->id,
            'sequence_order' => $i,
            'weight' => TopicWeight::Core,
        ]);
        $topics[] = $topic;
    }

    $result = $this->service->getDailyPlan($this->user, $this->goal);

    expect($result)->not->toBeNull();
    expect($result['days_remaining'])->toBe(14);
    expect($result['topics_remaining'])->toBe(7);
    expect($result['topics_per_day'])->toBe(1);
    expect($result['today_topics'])->toHaveCount(1);
    expect($result['suggested_time_minutes'])->toBe(10);
});

it('prioritizes weak topics in daily plan', function () {
    $weakTopic = CanonicalTopic::factory()->create(['title' => 'Weak One']);
    $strongTopic = CanonicalTopic::factory()->create(['title' => 'Strong One']);
    $untouchedTopic = CanonicalTopic::factory()->create(['title' => 'Untouched One']);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $weakTopic->id,
        'sequence_order' => 1,
        'weight' => TopicWeight::Core,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $strongTopic->id,
        'sequence_order' => 2,
        'weight' => TopicWeight::Core,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $untouchedTopic->id,
        'sequence_order' => 3,
        'weight' => TopicWeight::Core,
    ]);

    $weakQuestion = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    QuestionTopicLink::factory()->create([
        'question_id' => $weakQuestion->id,
        'canonical_topic_id' => $weakTopic->id,
    ]);

    $strongQuestion = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    QuestionTopicLink::factory()->create([
        'question_id' => $strongQuestion->id,
        'canonical_topic_id' => $strongTopic->id,
    ]);

    $session = PracticeSession::factory()->create(['user_id' => $this->user->id]);

    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $weakQuestion->id,
        'is_correct' => false,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $weakQuestion->id,
        'is_correct' => false,
    ]);

    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $strongQuestion->id,
        'is_correct' => true,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $strongQuestion->id,
        'is_correct' => true,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $strongQuestion->id,
        'is_correct' => true,
    ]);

    $this->goal->update(['exam_date' => now()->addDays(2)]);

    $result = $this->service->getDailyPlan($this->user, $this->goal->fresh());

    expect($result['today_topics'])->toHaveCount(1);
    expect($result['today_topics'][0]['title'])->toBe('Weak One');
});
