<?php

use App\Enums\PracticeMode;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionTopicLink;
use App\Models\SpacedRepetitionItem;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Services\PracticeService;

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
    $this->topic = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topic->id,
        'sequence_order' => 1,
    ]);

    $this->questions = Question::factory()->count(5)->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    foreach ($this->questions as $q) {
        QuestionTopicLink::factory()->create([
            'question_id' => $q->id,
            'canonical_topic_id' => $this->topic->id,
        ]);
    }

    $this->actingAs($this->user);
});

it('shows configure page with enrolled courses and topics', function () {
    $response = $this->get(route('practice.configure'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('practice/configure')
        ->has('enrolledCourses', 1)
        ->has('modes')
        ->has('difficulties')
        ->has('questionTypes')
    );
});

it('starts a practice session and redirects to show', function () {
    $response = $this->post(route('practice.start'), [
        'institution_course_id' => $this->course->id,
        'topic_ids' => [$this->topic->id],
        'question_count' => 5,
        'mode' => PracticeMode::Untimed->value,
    ]);

    $session = PracticeSession::first();
    $response->assertRedirect(route('practice.show', $session));
    expect($session->question_ids)->toHaveCount(5);
    expect($session->user_id)->toBe($this->user->id);
});

it('validates course enrollment on start', function () {
    $otherCourse = InstitutionCourse::factory()->create();

    $response = $this->post(route('practice.start'), [
        'institution_course_id' => $otherCourse->id,
        'topic_ids' => [$this->topic->id],
        'question_count' => 5,
        'mode' => PracticeMode::Untimed->value,
    ]);

    $response->assertForbidden();
});

it('validates at least one topic on start', function () {
    $response = $this->post(route('practice.start'), [
        'institution_course_id' => $this->course->id,
        'topic_ids' => [],
        'question_count' => 5,
        'mode' => PracticeMode::Untimed->value,
    ]);

    $response->assertSessionHasErrors('topic_ids');
});

it('shows session with questions and progress', function () {
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
        'question_count' => 5,
    ]);

    $response = $this->get(route('practice.show', $session));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('practice/show')
        ->has('session')
        ->has('questions', 5)
        ->has('answers')
        ->has('currentIndex')
    );
});

it('prevents accessing another student session', function () {
    $otherUser = \App\Models\User::factory()->create();
    $session = PracticeSession::factory()->create([
        'user_id' => $otherUser->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
    ]);

    $response = $this->get(route('practice.show', $session));

    $response->assertForbidden();
});

it('saves MCQ answer with correct grading — correct answer', function () {
    $question = $this->questions->first();
    $correctLabel = collect($question->response_config['options'])->firstWhere('is_correct', true)['label'];
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'question_ids' => [$question->id],
        'question_count' => 1,
    ]);

    $response = $this->postJson(route('practice.answer', $session), [
        'question_id' => $question->id,
        'selected_label' => $correctLabel,
        'time_spent_seconds' => 15,
        'sequence_order' => 0,
    ]);

    $response->assertOk();
    $response->assertJson(['is_correct' => true]);
    expect(PracticeAnswer::where('question_id', $question->id)->first()->is_correct)->toBeTrue();
});

it('saves MCQ answer with correct grading — incorrect answer', function () {
    $question = $this->questions->first();
    $wrongLabel = collect($question->response_config['options'])->firstWhere('is_correct', false)['label'];
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'question_ids' => [$question->id],
        'question_count' => 1,
    ]);

    $response = $this->postJson(route('practice.answer', $session), [
        'question_id' => $question->id,
        'selected_label' => $wrongLabel,
        'time_spent_seconds' => 10,
        'sequence_order' => 0,
    ]);

    $response->assertOk();
    $response->assertJson(['is_correct' => false]);
});

it('increments question attempt_count on answer', function () {
    $question = $this->questions->first();
    $originalCount = $question->attempt_count;
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'question_ids' => [$question->id],
        'question_count' => 1,
    ]);

    $this->postJson(route('practice.answer', $session), [
        'question_id' => $question->id,
        'selected_label' => 'A',
        'time_spent_seconds' => 5,
        'sequence_order' => 0,
    ]);

    expect($question->fresh()->attempt_count)->toBe($originalCount + 1);
});

it('prevents answering already answered question', function () {
    $question = $this->questions->first();
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'question_ids' => [$question->id],
        'question_count' => 1,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $question->id,
    ]);

    $response = $this->postJson(route('practice.answer', $session), [
        'question_id' => $question->id,
        'selected_label' => 'A',
        'time_spent_seconds' => 5,
        'sequence_order' => 0,
    ]);

    $response->assertUnprocessable();
});

it('prevents answering question not in session', function () {
    $outsideQuestion = Question::factory()->create(['institution_course_id' => $this->course->id]);
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'question_ids' => [$this->questions->first()->id],
        'question_count' => 1,
    ]);

    $response = $this->postJson(route('practice.answer', $session), [
        'question_id' => $outsideQuestion->id,
        'selected_label' => 'A',
        'time_spent_seconds' => 5,
        'sequence_order' => 0,
    ]);

    $response->assertUnprocessable();
});

it('completes session with correct score', function () {
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
        'question_count' => 5,
    ]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $this->questions[0]->id, 'is_correct' => true, 'time_spent_seconds' => 10]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $this->questions[1]->id, 'is_correct' => false, 'time_spent_seconds' => 10]);

    $response = $this->post(route('practice.complete', $session));

    $response->assertRedirect(route('practice.results', $session));
    $session->refresh();
    expect($session->correct_count)->toBe(1);
    expect((float) $session->score_percentage)->toBe(50.0);
});

it('sets completed_at and is_resumable false on complete', function () {
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
        'question_count' => 5,
    ]);

    $this->post(route('practice.complete', $session));

    $session->refresh();
    expect($session->completed_at)->not->toBeNull();
    expect($session->is_resumable)->toBeFalse();
});

it('returns per-question and per-topic breakdown in results', function () {
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => [$this->questions[0]->id, $this->questions[1]->id],
        'question_count' => 2,
        'correct_count' => 1,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $this->questions[0]->id,
        'is_correct' => true,
        'sequence_order' => 0,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $this->questions[1]->id,
        'is_correct' => false,
        'sequence_order' => 1,
    ]);

    $response = $this->get(route('practice.results', $session));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('practice/results')
        ->has('session')
        ->has('perQuestion', 2)
        ->has('perTopic')
    );
});

it('redirects to show for incomplete session results', function () {
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
        'completed_at' => null,
    ]);

    $response = $this->get(route('practice.results', $session));

    $response->assertRedirect(route('practice.show', $session));
});

it('returns available count matching filters', function () {
    $response = $this->getJson(route('api.practice.available-count', [
        'institution_course_id' => $this->course->id,
    ]));

    $response->assertOk();
    $response->assertJson(['count' => 5]);
});

it('redirects completed session show to results', function () {
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
        'is_resumable' => false,
    ]);

    $response = $this->get(route('practice.show', $session));

    $response->assertRedirect(route('practice.results', $session));
});

it('prevents answering on a completed session', function () {
    $question = $this->questions->first();
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'question_ids' => [$question->id],
        'question_count' => 1,
    ]);

    $response = $this->postJson(route('practice.answer', $session), [
        'question_id' => $question->id,
        'selected_label' => 'A',
        'time_spent_seconds' => 5,
        'sequence_order' => 0,
    ]);

    $response->assertUnprocessable();
});

it('prevents accessing another student results', function () {
    $otherUser = \App\Models\User::factory()->create();
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $otherUser->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
    ]);

    $response = $this->get(route('practice.results', $session));

    $response->assertForbidden();
});

it('records skipped answer via answer endpoint', function () {
    $question = $this->questions->first();
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'question_ids' => [$question->id],
        'question_count' => 1,
    ]);

    $response = $this->postJson(route('practice.answer', $session), [
        'question_id' => $question->id,
        'response_data' => [],
        'time_spent_seconds' => 2,
        'sequence_order' => 0,
        'was_skipped' => true,
    ]);

    $response->assertOk();
    $answer = PracticeAnswer::where('question_id', $question->id)->first();
    expect($answer->was_skipped)->toBeTrue();
    expect($answer->is_correct)->toBeNull();
});

it('returns results with per-question data shape', function () {
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => [$this->questions[0]->id],
        'question_count' => 1,
        'correct_count' => 1,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $this->questions[0]->id,
        'is_correct' => true,
        'time_spent_seconds' => 12,
        'sequence_order' => 0,
    ]);

    $response = $this->get(route('practice.results', $session));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('practice/results')
        ->has('perQuestion.0', fn ($q) => $q
            ->has('question_id')
            ->has('question_content')
            ->has('question_type')
            ->where('is_correct', true)
            ->where('was_skipped', false)
            ->has('student_answer')
            ->has('correct_answer')
            ->where('time_spent_seconds', 12)
            ->has('quick_answer')
        )
    );
});

it('handles already completed session on complete gracefully', function () {
    $session = PracticeSession::factory()->completed()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => $this->questions->pluck('id')->toArray(),
    ]);

    $response = $this->post(route('practice.complete', $session));

    $response->assertRedirect(route('practice.results', $session));
});

it('starts single-question session via question_id without course fields', function () {
    $question = $this->questions->first();

    $response = $this->post(route('practice.start'), [
        'question_id' => $question->id,
        'mode' => PracticeMode::Untimed->value,
    ]);

    $session = PracticeSession::first();
    $response->assertRedirect(route('practice.show', $session));
    expect($session->question_ids)->toHaveCount(1);
    expect($session->question_ids[0])->toBe($question->id);
    expect($session->institution_course_id)->toBe($this->course->id);
});

it('selectQuestions returns exact question when question_id provided', function () {
    $service = app(PracticeService::class);
    $question = $this->questions->first();

    $result = $service->selectQuestions(['question_id' => $question->id]);

    expect($result)->toHaveCount(1);
    expect($result->first()->id)->toBe($question->id);
});

it('completeSession schedules spaced repetition for answered questions', function () {
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'question_ids' => [$this->questions[0]->id, $this->questions[1]->id, $this->questions[2]->id],
        'question_count' => 3,
    ]);

    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $this->questions[0]->id,
        'is_correct' => true,
        'time_spent_seconds' => 10,
    ]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $this->questions[1]->id,
        'is_correct' => false,
        'time_spent_seconds' => 10,
    ]);
    PracticeAnswer::factory()->skipped()->create([
        'practice_session_id' => $session->id,
        'question_id' => $this->questions[2]->id,
        'time_spent_seconds' => 0,
    ]);

    $this->post(route('practice.complete', $session));

    expect(SpacedRepetitionItem::where('user_id', $this->user->id)->count())->toBe(2);
    expect(SpacedRepetitionItem::where('user_id', $this->user->id)->where('question_id', $this->questions[0]->id)->first()->interval_days)->toBe(1);
    expect(SpacedRepetitionItem::where('user_id', $this->user->id)->where('question_id', $this->questions[1]->id)->first()->repetition_count)->toBe(0);
});

it('available count respects topic filter combination', function () {
    $otherTopic = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $otherTopic->id,
        'sequence_order' => 2,
    ]);

    $topicAQuestion = Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    $topicBQuestion = Question::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);

    QuestionTopicLink::factory()->create(['question_id' => $topicAQuestion->id, 'canonical_topic_id' => $this->topic->id]);
    QuestionTopicLink::factory()->create(['question_id' => $topicBQuestion->id, 'canonical_topic_id' => $otherTopic->id]);

    $singleTopicResponse = $this->getJson(route('api.practice.available-count', [
        'institution_course_id' => $this->course->id,
        'topic_ids' => [$this->topic->id],
    ]));
    $singleTopicResponse->assertOk();
    $singleTopicResponse->assertJson(['count' => 6]);

    $bothTopicsResponse = $this->getJson(route('api.practice.available-count', [
        'institution_course_id' => $this->course->id,
        'topic_ids' => [$this->topic->id, $otherTopic->id],
    ]));
    $bothTopicsResponse->assertOk();
    $bothTopicsResponse->assertJson(['count' => 7]);
});
