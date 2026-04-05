<?php

use App\Enums\SpacedRepetitionStatus;
use App\Enums\VerificationResult;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\PracticeAnswer;
use App\Models\PracticeSession;
use App\Models\QuestionTopicLink;
use App\Models\SpacedRepetitionItem;
use App\Models\TopicCompletion;
use App\Models\VerificationAttempt;
use App\Services\ParentDashboard\ParentVerificationService;

beforeEach(function () {
    $this->service = app(ParentVerificationService::class);
    $this->link = ParentChildLink::factory()->active()->withTermConfig()->create();
    $this->childUser = $this->link->studentProfile->user;
});

test('app-driven eligible topics appear in queue when completed with 85%+ accuracy', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => ['concept1'], 'true_false' => [], 'explain_prompt' => 'Explain'],
    ]);

    TopicCompletion::query()->create([
        'user_id' => $this->childUser->id,
        'canonical_topic_id' => $topic->id,
        'completed_at' => now(),
    ]);

    $question = \App\Models\Question::factory()->create();
    QuestionTopicLink::query()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $topic->id,
        'is_primary' => true,
    ]);

    $session = PracticeSession::factory()->create(['user_id' => $this->childUser->id]);
    PracticeAnswer::factory()->create([
        'practice_session_id' => $session->id,
        'question_id' => $question->id,
        'is_correct' => true,
    ]);

    $queue = $this->service->getVerificationQueue($this->link);

    expect($queue)->toHaveCount(1);
    expect($queue->first()->id)->toBe($topic->id);
});

test('app-driven below 85% accuracy excluded from queue', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => ['c1'], 'true_false' => [], 'explain_prompt' => 'E'],
    ]);

    TopicCompletion::query()->create([
        'user_id' => $this->childUser->id,
        'canonical_topic_id' => $topic->id,
        'completed_at' => now(),
    ]);

    $q1 = \App\Models\Question::factory()->create();
    $q2 = \App\Models\Question::factory()->create();
    QuestionTopicLink::query()->create(['question_id' => $q1->id, 'canonical_topic_id' => $topic->id, 'is_primary' => true]);
    QuestionTopicLink::query()->create(['question_id' => $q2->id, 'canonical_topic_id' => $topic->id, 'is_primary' => false]);

    $session = PracticeSession::factory()->create(['user_id' => $this->childUser->id]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $q1->id, 'is_correct' => true]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $q2->id, 'is_correct' => false]);

    $queue = $this->service->getVerificationQueue($this->link);

    expect($queue)->toHaveCount(0);
});

test('understood topics excluded from queue', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => ['c'], 'true_false' => [], 'explain_prompt' => 'E'],
    ]);

    TopicCompletion::query()->create([
        'user_id' => $this->childUser->id,
        'canonical_topic_id' => $topic->id,
        'completed_at' => now(),
    ]);

    $question = \App\Models\Question::factory()->create();
    QuestionTopicLink::query()->create(['question_id' => $question->id, 'canonical_topic_id' => $topic->id, 'is_primary' => true]);
    $session = PracticeSession::factory()->create(['user_id' => $this->childUser->id]);
    PracticeAnswer::factory()->create(['practice_session_id' => $session->id, 'question_id' => $question->id, 'is_correct' => true]);

    VerificationAttempt::factory()->understood()->create([
        'parent_child_link_id' => $this->link->id,
        'canonical_topic_id' => $topic->id,
    ]);

    $queue = $this->service->getVerificationQueue($this->link);

    expect($queue)->toHaveCount(0);
});

test('needs review and partially understood topics stay in queue', function () {
    $topic1 = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => ['c'], 'true_false' => [], 'explain_prompt' => 'E'],
    ]);
    $topic2 = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => ['c'], 'true_false' => [], 'explain_prompt' => 'E'],
    ]);

    foreach ([$topic1, $topic2] as $topic) {
        TopicCompletion::query()->create(['user_id' => $this->childUser->id, 'canonical_topic_id' => $topic->id, 'completed_at' => now()]);
        $q = \App\Models\Question::factory()->create();
        QuestionTopicLink::query()->create(['question_id' => $q->id, 'canonical_topic_id' => $topic->id, 'is_primary' => true]);
        $s = PracticeSession::factory()->create(['user_id' => $this->childUser->id]);
        PracticeAnswer::factory()->create(['practice_session_id' => $s->id, 'question_id' => $q->id, 'is_correct' => true]);
    }

    VerificationAttempt::factory()->needsReview()->create(['parent_child_link_id' => $this->link->id, 'canonical_topic_id' => $topic1->id]);
    VerificationAttempt::factory()->create(['parent_child_link_id' => $this->link->id, 'canonical_topic_id' => $topic2->id, 'overall_result' => VerificationResult::PartiallyUnderstood]);

    $queue = $this->service->getVerificationQueue($this->link);

    expect($queue)->toHaveCount(2);
});

test('getVerificationKit returns structured data for topic with kit', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => [
            'parent_briefing' => 'This is about cells.',
            'key_concepts' => ['Cell wall', 'Nucleus'],
            'true_false' => [['statement' => 'Cells have walls', 'answer' => true, 'explanation' => 'Plant cells do']],
            'explain_prompt' => 'Explain the difference between plant and animal cells.',
        ],
    ]);

    $kit = $this->service->getVerificationKit($topic->id);

    expect($kit)->not->toBeNull();
    expect($kit)->toHaveKeys(['topic_id', 'topic_title', 'parent_briefing', 'key_concepts', 'true_false', 'explain_prompt']);
    expect($kit['key_concepts'])->toHaveCount(2);
    expect($kit['parent_briefing'])->toBe('This is about cells.');
});

test('getVerificationKit returns null for topic without kit', function () {
    $topic = CanonicalTopic::factory()->create(['parent_verification_kit' => null]);

    $kit = $this->service->getVerificationKit($topic->id);

    expect($kit)->toBeNull();
});

test('submitVerification creates verification attempt record', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => [], 'true_false' => [], 'explain_prompt' => ''],
    ]);

    $attempt = $this->service->submitVerification(
        link: $this->link,
        canonicalTopicId: $topic->id,
        responses: ['explain_checklist' => [true, false]],
        overallResult: VerificationResult::Understood,
        notes: 'Good understanding',
    );

    expect($attempt)->toBeInstanceOf(VerificationAttempt::class);
    expect($attempt->overall_result)->toBe(VerificationResult::Understood);
    expect($attempt->notes)->toBe('Good understanding');

    $this->assertDatabaseHas('verification_attempts', [
        'parent_child_link_id' => $this->link->id,
        'canonical_topic_id' => $topic->id,
        'overall_result' => VerificationResult::Understood->value,
    ]);
});

test('partially understood resets active SR items to interval_days 1', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => [], 'true_false' => [], 'explain_prompt' => ''],
    ]);

    $question = \App\Models\Question::factory()->create();
    QuestionTopicLink::query()->create(['question_id' => $question->id, 'canonical_topic_id' => $topic->id, 'is_primary' => true]);

    $srItem = SpacedRepetitionItem::factory()->create([
        'user_id' => $this->childUser->id,
        'question_id' => $question->id,
        'status' => SpacedRepetitionStatus::Active,
        'interval_days' => 14,
    ]);

    $graduatedItem = SpacedRepetitionItem::factory()->create([
        'user_id' => $this->childUser->id,
        'question_id' => \App\Models\Question::factory()->create()->id,
        'status' => SpacedRepetitionStatus::Graduated,
        'interval_days' => 30,
    ]);

    $this->service->submitVerification(
        link: $this->link,
        canonicalTopicId: $topic->id,
        responses: [],
        overallResult: VerificationResult::PartiallyUnderstood,
    );

    $srItem->refresh();
    $graduatedItem->refresh();

    expect($srItem->interval_days)->toBe(1);
    expect($graduatedItem->interval_days)->toBe(30);
});

test('needs review fully resets all SR items including graduated', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => [], 'true_false' => [], 'explain_prompt' => ''],
    ]);

    $question = \App\Models\Question::factory()->create();
    QuestionTopicLink::query()->create(['question_id' => $question->id, 'canonical_topic_id' => $topic->id, 'is_primary' => true]);

    $graduatedItem = SpacedRepetitionItem::factory()->create([
        'user_id' => $this->childUser->id,
        'question_id' => $question->id,
        'status' => SpacedRepetitionStatus::Graduated,
        'interval_days' => 30,
        'repetition_count' => 10,
    ]);

    $this->service->submitVerification(
        link: $this->link,
        canonicalTopicId: $topic->id,
        responses: [],
        overallResult: VerificationResult::NeedsReview,
    );

    $graduatedItem->refresh();

    expect($graduatedItem->status)->toBe(SpacedRepetitionStatus::Active);
    expect($graduatedItem->interval_days)->toBe(1);
    expect($graduatedItem->repetition_count)->toBe(0);
});

test('getVerificationStats returns correct counts', function () {
    $topics = CanonicalTopic::factory()->count(3)->create();

    VerificationAttempt::factory()->understood()->create([
        'parent_child_link_id' => $this->link->id,
        'canonical_topic_id' => $topics[0]->id,
    ]);
    VerificationAttempt::factory()->understood()->create([
        'parent_child_link_id' => $this->link->id,
        'canonical_topic_id' => $topics[1]->id,
    ]);
    VerificationAttempt::factory()->needsReview()->create([
        'parent_child_link_id' => $this->link->id,
        'canonical_topic_id' => $topics[2]->id,
    ]);

    $stats = $this->service->getVerificationStats($this->link);

    expect($stats['total'])->toBe(3);
    expect($stats['understood'])->toBe(2);
    expect($stats['needs_review'])->toBe(1);
    expect($stats['partially_understood'])->toBe(0);
});
