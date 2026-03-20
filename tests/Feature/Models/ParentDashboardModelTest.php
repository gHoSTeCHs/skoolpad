<?php

use App\Enums\AccountType;
use App\Enums\CheckInSessionStatus;
use App\Enums\Term;
use App\Enums\TopicCoverageSource;
use App\Enums\TopicCoverageStatus;
use App\Models\CanonicalTopic;
use App\Models\ParentCheckInSession;
use App\Models\ParentChildLink;
use App\Models\PracticeSession;
use App\Models\TopicCoverage;
use App\Models\User;

test('TopicCoverage belongs to ParentChildLink', function () {
    $link = ParentChildLink::factory()->active()->create();
    $topic = CanonicalTopic::factory()->create();

    $coverage = TopicCoverage::factory()->create([
        'parent_child_link_id' => $link->id,
        'canonical_topic_id' => $topic->id,
    ]);

    expect($coverage->parentChildLink)->toBeInstanceOf(ParentChildLink::class);
    expect($coverage->parentChildLink->id)->toBe($link->id);
    expect($coverage->canonicalTopic)->toBeInstanceOf(CanonicalTopic::class);
    expect($coverage->canonicalTopic->id)->toBe($topic->id);
});

test('TopicCoverage casts status and source as enums', function () {
    $coverage = TopicCoverage::factory()->create();

    expect($coverage->status)->toBeInstanceOf(TopicCoverageStatus::class);
    expect($coverage->source)->toBeInstanceOf(TopicCoverageSource::class);
});

test('TopicCoverage enforces unique constraint on link + topic', function () {
    $link = ParentChildLink::factory()->active()->create();
    $topic = CanonicalTopic::factory()->create();

    TopicCoverage::factory()->create([
        'parent_child_link_id' => $link->id,
        'canonical_topic_id' => $topic->id,
    ]);

    expect(fn () => TopicCoverage::factory()->create([
        'parent_child_link_id' => $link->id,
        'canonical_topic_id' => $topic->id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('TopicCoverage factory states work correctly', function () {
    $notCovered = TopicCoverage::factory()->notYetCovered()->create();
    $skipped = TopicCoverage::factory()->skipped()->create();
    $fromScheme = TopicCoverage::factory()->fromScheme()->create();

    expect($notCovered->status)->toBe(TopicCoverageStatus::NotYetCovered);
    expect($notCovered->covered_at)->toBeNull();
    expect($skipped->status)->toBe(TopicCoverageStatus::Skipped);
    expect($fromScheme->source)->toBe(TopicCoverageSource::SchemeDefault);
});

test('ParentCheckInSession belongs to ParentChildLink', function () {
    $link = ParentChildLink::factory()->active()->create();

    $session = ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $link->id,
    ]);

    expect($session->parentChildLink)->toBeInstanceOf(ParentChildLink::class);
    expect($session->parentChildLink->id)->toBe($link->id);
});

test('ParentCheckInSession casts fields correctly', function () {
    $session = ParentCheckInSession::factory()->create([
        'items' => [['type' => 'verification', 'topic_id' => 'abc']],
        'completed_items' => [],
    ]);

    expect($session->status)->toBeInstanceOf(CheckInSessionStatus::class);
    expect($session->items)->toBeArray();
    expect($session->completed_items)->toBeArray();
    expect($session->session_date)->toBeInstanceOf(\Carbon\CarbonImmutable::class);
    expect($session->duration_minutes)->toBeInt();
});

test('ParentCheckInSession enforces unique constraint on link + date', function () {
    $link = ParentChildLink::factory()->active()->create();
    $date = now()->toDateString();

    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $link->id,
        'session_date' => $date,
    ]);

    expect(fn () => ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $link->id,
        'session_date' => $date,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('ParentCheckInSession factory states work correctly', function () {
    $inProgress = ParentCheckInSession::factory()->inProgress()->create();
    $completed = ParentCheckInSession::factory()->completed()->create();

    expect($inProgress->status)->toBe(CheckInSessionStatus::InProgress);
    expect($inProgress->started_at)->not->toBeNull();
    expect($completed->status)->toBe(CheckInSessionStatus::Completed);
    expect($completed->completed_at)->not->toBeNull();
});

test('ParentChildLink has topicCoverages relationship', function () {
    $link = ParentChildLink::factory()->active()->create();
    TopicCoverage::factory()->count(3)->create(['parent_child_link_id' => $link->id]);

    expect($link->topicCoverages)->toHaveCount(3);
    expect($link->topicCoverages->first())->toBeInstanceOf(TopicCoverage::class);
});

test('ParentChildLink has checkInSessions relationship', function () {
    $link = ParentChildLink::factory()->active()->create();
    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $link->id,
        'session_date' => now()->toDateString(),
    ]);
    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $link->id,
        'session_date' => now()->subDay()->toDateString(),
    ]);

    expect($link->checkInSessions)->toHaveCount(2);
    expect($link->checkInSessions->first())->toBeInstanceOf(ParentCheckInSession::class);
});

test('ParentChildLink casts new term columns correctly', function () {
    $link = ParentChildLink::factory()->active()->create([
        'current_term' => 'first',
        'term_start_date' => '2026-01-15',
        'grace_period_ends_at' => now()->addDays(30),
    ]);

    expect($link->current_term)->toBeInstanceOf(Term::class);
    expect($link->current_term)->toBe(Term::First);
    expect($link->term_start_date)->toBeInstanceOf(\Carbon\CarbonImmutable::class);
    expect($link->grace_period_ends_at)->toBeInstanceOf(\Carbon\CarbonImmutable::class);
});

test('User has account_type cast as AccountType enum', function () {
    $student = User::factory()->create();
    $parent = User::factory()->parent()->create();

    expect($student->account_type)->toBeInstanceOf(AccountType::class);
    expect($student->account_type)->toBe(AccountType::Student);
    expect($parent->account_type)->toBe(AccountType::Parent);
});

test('PracticeSession has administered_by in fillable and relationship', function () {
    $parent = User::factory()->parent()->create();
    $student = User::factory()->create();

    $session = PracticeSession::factory()->create([
        'user_id' => $student->id,
        'administered_by' => $parent->id,
    ]);

    expect($session->administered_by)->toBe($parent->id);
    expect($session->administeredBy)->toBeInstanceOf(User::class);
    expect($session->administeredBy->id)->toBe($parent->id);
});

test('PracticeSession administered_by is nullable', function () {
    $session = PracticeSession::factory()->create(['administered_by' => null]);

    expect($session->administered_by)->toBeNull();
    expect($session->administeredBy)->toBeNull();
});

test('TopicCoverage cascade deletes when ParentChildLink is deleted', function () {
    $link = ParentChildLink::factory()->active()->create();
    TopicCoverage::factory()->count(3)->create(['parent_child_link_id' => $link->id]);

    expect(TopicCoverage::query()->where('parent_child_link_id', $link->id)->count())->toBe(3);

    $link->delete();

    expect(TopicCoverage::query()->where('parent_child_link_id', $link->id)->count())->toBe(0);
});

test('ParentCheckInSession cascade deletes when ParentChildLink is deleted', function () {
    $link = ParentChildLink::factory()->active()->create();
    ParentCheckInSession::factory()->create(['parent_child_link_id' => $link->id]);

    expect(ParentCheckInSession::query()->where('parent_child_link_id', $link->id)->count())->toBe(1);

    $link->delete();

    expect(ParentCheckInSession::query()->where('parent_child_link_id', $link->id)->count())->toBe(0);
});
