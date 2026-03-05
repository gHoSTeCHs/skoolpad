<?php

use App\Enums\PracticeMode;
use App\Enums\QuestionDifficulty;
use App\Enums\QuestionType;
use App\Models\CanonicalTopic;
use App\Models\InstitutionCourse;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionTopicLink;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Services\PracticeService;

beforeEach(function () {
    $this->service = app(PracticeService::class);
    $this->profile = StudentProfile::factory()->create();
    $this->user = $this->profile->user;
    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);
    $this->topic = CanonicalTopic::factory()->create();
});

it('selects questions matching course filter', function () {
    $otherCourse = InstitutionCourse::factory()->create();
    Question::factory()->count(3)->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    Question::factory()->count(2)->create(['institution_course_id' => $otherCourse->id, 'is_published' => true]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(3);
    expect($result->pluck('institution_course_id')->unique()->toArray())->toBe([$this->course->id]);
});

it('selects questions matching topic filter', function () {
    $otherTopic = CanonicalTopic::factory()->create();
    $matchingQ = Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    $nonMatchingQ = Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);

    QuestionTopicLink::factory()->create(['question_id' => $matchingQ->id, 'canonical_topic_id' => $this->topic->id]);
    QuestionTopicLink::factory()->create(['question_id' => $nonMatchingQ->id, 'canonical_topic_id' => $otherTopic->id]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'topic_ids' => [$this->topic->id],
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(1);
    expect($result->first()->id)->toBe($matchingQ->id);
});

it('selects questions matching difficulty filter', function () {
    Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true, 'difficulty_level' => QuestionDifficulty::Easy]);
    Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true, 'difficulty_level' => QuestionDifficulty::Hard]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'difficulty' => 'easy',
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(1);
    expect($result->first()->difficulty_level)->toBe(QuestionDifficulty::Easy);
});

it('selects questions matching type filter', function () {
    Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true, 'question_type' => QuestionType::Mcq]);
    Question::factory()->theory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'question_types' => [QuestionType::Mcq->value],
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(1);
    expect($result->first()->question_type)->toBe(QuestionType::Mcq);
});

it('only selects published questions', function () {
    Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    Question::factory()->draft()->create(['institution_course_id' => $this->course->id]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(1);
});

it('excludes recently correctly answered questions', function () {
    $answeredQ = Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    $freshQ = Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);

    $session = PracticeSession::factory()->create(['user_id' => $this->user->id]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $answeredQ->id,
        'is_correct' => true,
        'created_at' => now()->subDays(3),
    ]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'exclude_user_id' => $this->user->id,
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(1);
    expect($result->first()->id)->toBe($freshQ->id);
});

it('handles empty result set gracefully', function () {
    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(0);
    expect($result)->toBeInstanceOf(\Illuminate\Support\Collection::class);
});

it('limits to requested question count', function () {
    Question::factory()->count(20)->create(['institution_course_id' => $this->course->id, 'is_published' => true]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'question_count' => 10,
    ]);

    expect($result)->toHaveCount(10);
});

it('grades MCQ correctly when answer matches', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Mcq,
        'response_config' => [
            'options' => [
                ['label' => 'A', 'text' => 'Wrong', 'is_correct' => false],
                ['label' => 'B', 'text' => 'Correct', 'is_correct' => true],
                ['label' => 'C', 'text' => 'Wrong', 'is_correct' => false],
                ['label' => 'D', 'text' => 'Wrong', 'is_correct' => false],
            ],
        ],
    ]);

    $result = $this->service->gradeAnswer($question, ['selected_label' => 'B']);

    expect($result)->toBeTrue();
});

it('grades MCQ incorrectly when answer does not match', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_type' => QuestionType::Mcq,
        'response_config' => [
            'options' => [
                ['label' => 'A', 'text' => 'Wrong', 'is_correct' => false],
                ['label' => 'B', 'text' => 'Correct', 'is_correct' => true],
                ['label' => 'C', 'text' => 'Wrong', 'is_correct' => false],
                ['label' => 'D', 'text' => 'Wrong', 'is_correct' => false],
            ],
        ],
    ]);

    $result = $this->service->gradeAnswer($question, ['selected_label' => 'A']);

    expect($result)->toBeFalse();
});

it('returns null for non-gradable question types', function () {
    $question = Question::factory()->theory()->create([
        'institution_course_id' => $this->course->id,
    ]);

    $result = $this->service->gradeAnswer($question, ['text' => 'Some answer']);

    expect($result)->toBeNull();
});

it('returns accurate available question count', function () {
    Question::factory()->count(5)->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    Question::factory()->draft()->count(3)->create(['institution_course_id' => $this->course->id]);

    $count = $this->service->getAvailableQuestionCount([
        'institution_course_id' => $this->course->id,
    ]);

    expect($count)->toBe(5);
});

it('completes session with correct aggregates', function () {
    $questions = Question::factory()->count(5)->create(['institution_course_id' => $this->course->id]);
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_count' => 5,
        'correct_count' => 0,
    ]);

    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $questions[0]->id, 'is_correct' => true, 'time_spent_seconds' => 30]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $questions[1]->id, 'is_correct' => true, 'time_spent_seconds' => 20]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $questions[2]->id, 'is_correct' => true, 'time_spent_seconds' => 25]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $questions[3]->id, 'is_correct' => false, 'time_spent_seconds' => 15]);
    PracticeAnswer::factory()->skipped()->create(['practice_session_id' => $session->id, 'question_id' => $questions[4]->id, 'time_spent_seconds' => 0]);

    $result = $this->service->completeSession($session);

    expect($result->correct_count)->toBe(3);
    expect((float) $result->score_percentage)->toBe(75.0);
    expect($result->total_time_seconds)->toBe(90);
    expect($result->completed_at)->not->toBeNull();
    expect($result->is_resumable)->toBeFalse();
});

it('selectQuestions returns randomized order across calls', function () {
    Question::factory()->count(20)->create(['institution_course_id' => $this->course->id, 'is_published' => true]);

    $orders = [];
    for ($i = 0; $i < 5; $i++) {
        $result = $this->service->selectQuestions([
            'institution_course_id' => $this->course->id,
            'question_count' => 20,
        ]);
        $orders[] = $result->pluck('id')->toArray();
    }

    $uniqueOrders = array_unique(array_map('serialize', $orders));
    expect(count($uniqueOrders))->toBeGreaterThan(1);
});

it('selects questions matching combined course, topic, difficulty, and type filters', function () {
    $otherTopic = CanonicalTopic::factory()->create();

    $matchAll = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
        'difficulty_level' => QuestionDifficulty::Easy,
        'question_type' => QuestionType::Mcq,
    ]);
    QuestionTopicLink::factory()->create(['question_id' => $matchAll->id, 'canonical_topic_id' => $this->topic->id]);

    $wrongDifficulty = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
        'difficulty_level' => QuestionDifficulty::Hard,
        'question_type' => QuestionType::Mcq,
    ]);
    QuestionTopicLink::factory()->create(['question_id' => $wrongDifficulty->id, 'canonical_topic_id' => $this->topic->id]);

    $wrongType = Question::factory()->theory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
        'difficulty_level' => QuestionDifficulty::Easy,
    ]);
    QuestionTopicLink::factory()->create(['question_id' => $wrongType->id, 'canonical_topic_id' => $this->topic->id]);

    $wrongTopic = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
        'difficulty_level' => QuestionDifficulty::Easy,
        'question_type' => QuestionType::Mcq,
    ]);
    QuestionTopicLink::factory()->create(['question_id' => $wrongTopic->id, 'canonical_topic_id' => $otherTopic->id]);

    $result = $this->service->selectQuestions([
        'institution_course_id' => $this->course->id,
        'topic_ids' => [$this->topic->id],
        'difficulty' => 'easy',
        'question_types' => [QuestionType::Mcq->value],
        'question_count' => 20,
    ]);

    expect($result)->toHaveCount(1);
    expect($result->first()->id)->toBe($matchAll->id);
});

it('creates session with question_ids stored', function () {
    Question::factory()->count(5)->create(['institution_course_id' => $this->course->id, 'is_published' => true]);

    $session = $this->service->createSession($this->user, [
        'institution_course_id' => $this->course->id,
        'mode' => PracticeMode::Untimed->value,
        'question_count' => 5,
    ]);

    expect($session->question_ids)->toHaveCount(5);
    expect($session->question_count)->toBe(5);
    expect($session->mode)->toBe(PracticeMode::Untimed);
    expect($session->user_id)->toBe($this->user->id);
});
