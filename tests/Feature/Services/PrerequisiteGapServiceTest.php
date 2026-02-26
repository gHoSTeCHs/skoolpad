<?php

use App\Models\CanonicalTopic;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\TopicCompletion;
use App\Models\User;
use App\Services\PrerequisiteGapService;

beforeEach(function () {
    $this->service = new PrerequisiteGapService;
    $this->user = User::factory()->create();
    $this->topic = CanonicalTopic::factory()->create();
});

test('returns none banner when topic has no prerequisites', function () {
    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    expect($result['banner'])->toBe('none')
        ->and($result['prerequisites'])->toBeEmpty();
});

test('returns completed when topic is read and accuracy is 60 percent or higher', function () {
    $prereq = CanonicalTopic::factory()->create();
    $this->topic->prerequisites()->attach($prereq->id, ['is_hard_prerequisite' => false]);

    TopicCompletion::factory()->create([
        'user_id' => $this->user->id,
        'canonical_topic_id' => $prereq->id,
    ]);

    $question = Question::factory()->create();
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'canonical_topic_id' => $prereq->id,
    ]);

    PracticeAnswer::factory()->count(6)->create([
        'practice_session_id' => $session->id,
        'question_id' => $question->id,
        'is_correct' => true,
    ]);
    PracticeAnswer::factory()->count(4)->create([
        'practice_session_id' => $session->id,
        'question_id' => $question->id,
        'is_correct' => false,
    ]);

    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    expect($result['prerequisites'][0]['status'])->toBe('completed')
        ->and($result['prerequisites'][0]['accuracy'])->toBe(60.0);
});

test('returns attempted when practiced but accuracy below 60 percent', function () {
    $prereq = CanonicalTopic::factory()->create();
    $this->topic->prerequisites()->attach($prereq->id, ['is_hard_prerequisite' => false]);

    $question = Question::factory()->create();
    $session = PracticeSession::factory()->create([
        'user_id' => $this->user->id,
        'canonical_topic_id' => $prereq->id,
    ]);

    PracticeAnswer::factory()->count(3)->create([
        'practice_session_id' => $session->id,
        'question_id' => $question->id,
        'is_correct' => true,
    ]);
    PracticeAnswer::factory()->count(7)->create([
        'practice_session_id' => $session->id,
        'question_id' => $question->id,
        'is_correct' => false,
    ]);

    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    expect($result['prerequisites'][0]['status'])->toBe('attempted')
        ->and($result['prerequisites'][0]['accuracy'])->toBe(30.0);
});

test('returns not_started when no interaction', function () {
    $prereq = CanonicalTopic::factory()->create();
    $this->topic->prerequisites()->attach($prereq->id, ['is_hard_prerequisite' => false]);

    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    expect($result['prerequisites'][0]['status'])->toBe('not_started')
        ->and($result['prerequisites'][0]['accuracy'])->toBeNull();
});

test('returns success banner when all prerequisites met', function () {
    $prereq1 = CanonicalTopic::factory()->create();
    $prereq2 = CanonicalTopic::factory()->create();

    $this->topic->prerequisites()->attach($prereq1->id, ['is_hard_prerequisite' => true]);
    $this->topic->prerequisites()->attach($prereq2->id, ['is_hard_prerequisite' => false]);

    TopicCompletion::factory()->create(['user_id' => $this->user->id, 'canonical_topic_id' => $prereq1->id]);
    TopicCompletion::factory()->create(['user_id' => $this->user->id, 'canonical_topic_id' => $prereq2->id]);

    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    expect($result['banner'])->toBe('success');
});

test('returns warning banner when some gaps exist', function () {
    $prereq1 = CanonicalTopic::factory()->create();
    $prereq2 = CanonicalTopic::factory()->create();

    $this->topic->prerequisites()->attach($prereq1->id, ['is_hard_prerequisite' => true]);
    $this->topic->prerequisites()->attach($prereq2->id, ['is_hard_prerequisite' => false]);

    TopicCompletion::factory()->create(['user_id' => $this->user->id, 'canonical_topic_id' => $prereq1->id]);

    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    expect($result['banner'])->toBe('warning');
});

test('returns danger banner when all hard prerequisites are unmet', function () {
    $hardPrereq1 = CanonicalTopic::factory()->create();
    $hardPrereq2 = CanonicalTopic::factory()->create();

    $this->topic->prerequisites()->attach($hardPrereq1->id, ['is_hard_prerequisite' => true]);
    $this->topic->prerequisites()->attach($hardPrereq2->id, ['is_hard_prerequisite' => true]);

    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    expect($result['banner'])->toBe('danger');
});

test('distinguishes hard and soft prerequisites', function () {
    $hard = CanonicalTopic::factory()->create();
    $soft = CanonicalTopic::factory()->create();

    $this->topic->prerequisites()->attach($hard->id, ['is_hard_prerequisite' => true]);
    $this->topic->prerequisites()->attach($soft->id, ['is_hard_prerequisite' => false]);

    $result = $this->service->getPrerequisiteStatus($this->user, $this->topic);

    $hardResult = collect($result['prerequisites'])->firstWhere('id', $hard->id);
    $softResult = collect($result['prerequisites'])->firstWhere('id', $soft->id);

    expect($hardResult['is_hard'])->toBeTrue()
        ->and($softResult['is_hard'])->toBeFalse();
});
