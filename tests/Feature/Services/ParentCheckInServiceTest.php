<?php

use App\Enums\CheckInSessionStatus;
use App\Enums\TopicCoverageSource;
use App\Enums\TopicCoverageStatus;
use App\Models\CanonicalTopic;
use App\Models\ParentCheckInSession;
use App\Models\ParentChildLink;
use App\Models\TopicCoverage;
use App\Services\ParentCheckInService;

beforeEach(function () {
    $this->service = app(ParentCheckInService::class);
    $this->link = ParentChildLink::factory()->active()->withTermConfig()->create();
    $this->topic = CanonicalTopic::factory()->create();
});

test('reportTopicCoverage creates a covered topic record', function () {
    $coverage = $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::Covered,
    );

    expect($coverage)->toBeInstanceOf(TopicCoverage::class);
    expect($coverage->status)->toBe(TopicCoverageStatus::Covered);
    expect($coverage->covered_at)->not->toBeNull();
    expect($coverage->source)->toBe(TopicCoverageSource::ParentReported);
    expect($coverage->parent_child_link_id)->toBe($this->link->id);
    expect($coverage->canonical_topic_id)->toBe($this->topic->id);
});

test('reportTopicCoverage creates a not-yet-covered record with null covered_at', function () {
    $coverage = $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::NotYetCovered,
    );

    expect($coverage->status)->toBe(TopicCoverageStatus::NotYetCovered);
    expect($coverage->covered_at)->toBeNull();
});

test('reportTopicCoverage creates a skipped record with null covered_at', function () {
    $coverage = $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::Skipped,
    );

    expect($coverage->status)->toBe(TopicCoverageStatus::Skipped);
    expect($coverage->covered_at)->toBeNull();
});

test('reportTopicCoverage updates existing record instead of creating duplicate', function () {
    $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::NotYetCovered,
    );

    $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::Covered,
    );

    $count = TopicCoverage::query()
        ->where('parent_child_link_id', $this->link->id)
        ->where('canonical_topic_id', $this->topic->id)
        ->count();

    expect($count)->toBe(1);
});

test('reportTopicCoverage sets covered_at when changing from not-yet-covered to covered', function () {
    $coverage = $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::NotYetCovered,
    );

    expect($coverage->covered_at)->toBeNull();

    $updated = $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::Covered,
    );

    expect($updated->covered_at)->not->toBeNull();
});

test('reportTopicCoverage clears covered_at when changing from covered to not-yet-covered', function () {
    $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::Covered,
    );

    $reverted = $this->service->reportTopicCoverage(
        parentChildLinkId: $this->link->id,
        canonicalTopicId: $this->topic->id,
        status: TopicCoverageStatus::NotYetCovered,
    );

    expect($reverted->status)->toBe(TopicCoverageStatus::NotYetCovered);
    expect($reverted->covered_at)->toBeNull();
});

test('getSchemeOffset returns 0 with no coverage records', function () {
    $offset = $this->service->getSchemeOffset($this->link->id);

    expect($offset)->toBe(0);
});

test('getSchemeOffset returns 0 with fewer than 5 covered topics', function () {
    TopicCoverage::factory()->count(3)->create([
        'parent_child_link_id' => $this->link->id,
        'status' => TopicCoverageStatus::Covered,
    ]);

    $offset = $this->service->getSchemeOffset($this->link->id);

    expect($offset)->toBe(0);
});

test('getSchemeOffset returns an integer with 5+ covered topics', function () {
    TopicCoverage::factory()->count(6)->create([
        'parent_child_link_id' => $this->link->id,
        'status' => TopicCoverageStatus::Covered,
    ]);

    $offset = $this->service->getSchemeOffset($this->link->id);

    expect($offset)->toBeInt();
});

test('generateCheckIn creates a session with pending status', function () {
    $session = $this->service->generateCheckIn($this->link);

    expect($session)->toBeInstanceOf(ParentCheckInSession::class);
    expect($session->status)->toBe(CheckInSessionStatus::Pending);
    expect($session->parent_child_link_id)->toBe($this->link->id);
    expect($session->session_date->toDateString())->toBe(now()->toDateString());
    expect($session->items)->toBeArray();
    expect($session->duration_minutes)->toBe(10);
});

test('generateCheckIn uses custom duration', function () {
    $session = $this->service->generateCheckIn($this->link, 15);

    expect($session->duration_minutes)->toBe(15);
});

test('generateCheckIn respects duration budget and excludes items that exceed remaining time', function () {
    $session = $this->service->generateCheckIn($this->link, 1);

    $totalEstimated = collect($session->items)->sum('estimated_minutes');

    expect($totalEstimated)->toBeLessThanOrEqual(1);
});

test('getOrCreateTonightsCheckIn returns existing session', function () {
    $existing = ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $this->link->id,
        'session_date' => now()->toDateString(),
    ]);

    $session = $this->service->getOrCreateTonightsCheckIn($this->link);

    expect($session->id)->toBe($existing->id);
});

test('getOrCreateTonightsCheckIn creates new session when none exists', function () {
    $session = $this->service->getOrCreateTonightsCheckIn($this->link);

    expect($session)->toBeInstanceOf(ParentCheckInSession::class);
    expect($session->session_date->toDateString())->toBe(now()->toDateString());
});

test('getCheckInHistory returns sessions ordered by date descending', function () {
    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $this->link->id,
        'session_date' => now()->subDays(3)->toDateString(),
    ]);
    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $this->link->id,
        'session_date' => now()->subDay()->toDateString(),
    ]);

    $history = $this->service->getCheckInHistory($this->link);

    expect($history)->toHaveCount(2);
    expect($history->first()->session_date->toDateString())->toBe(now()->subDay()->toDateString());
});

test('getReadTogetherContent returns content and kit for topic', function () {
    $topic = CanonicalTopic::factory()->create([
        'simplified_content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Simple version']]]]],
        'parent_verification_kit' => ['key_concepts' => ['c1'], 'true_false' => [], 'explain_prompt' => 'Explain'],
    ]);

    $content = $this->service->getReadTogetherContent($topic->id);

    expect($content)->not->toBeNull();
    expect($content)->toHaveKeys(['topic_id', 'topic_title', 'content', 'verification_kit']);
    expect($content['content'])->toBeArray();
    expect($content['verification_kit'])->toBeArray();
});

test('getReadTogetherContent returns null for nonexistent topic', function () {
    $content = $this->service->getReadTogetherContent('00000000-0000-0000-0000-000000000000');

    expect($content)->toBeNull();
});

test('initStudyAsChildSession returns child study context', function () {
    $context = $this->service->initStudyAsChildSession($this->link);

    expect($context)->toHaveKeys(['child_user_id', 'child_name', 'student_profile_id', 'is_secondary', 'subjects', 'study_goal_minutes']);
    expect($context['child_user_id'])->toBe($this->link->studentProfile->user->id);
    expect($context['child_name'])->toBeString();
    expect($context['student_profile_id'])->toBe($this->link->studentProfile->id);
});
