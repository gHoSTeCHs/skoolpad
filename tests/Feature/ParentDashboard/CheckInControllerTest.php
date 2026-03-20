<?php

use App\Enums\CheckInSessionStatus;
use App\Models\CanonicalTopic;
use App\Models\ParentCheckInSession;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->parentUser = User::factory()->parent()->create();
    $this->parentProfile = ParentProfile::factory()->create(['user_id' => $this->parentUser->id]);
    $this->link = ParentChildLink::factory()->active()->withTermConfig()->create(['parent_profile_id' => $this->parentProfile->id]);
    $this->studentProfile = $this->link->studentProfile;
    $this->actingAs($this->parentUser);
});

test('parent can view check-in session', function () {
    $this->get(route('parent.checkin.show', $this->studentProfile->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('parent/check-in/show')
            ->has('child')
            ->has('checkIn')
        );
});

test('parent can complete check-in', function () {
    $session = ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $this->link->id,
        'session_date' => now()->toDateString(),
        'items' => [['type' => 'verification', 'canonical_topic_id' => 'test-id', 'topic_title' => 'Test', 'estimated_minutes' => 3]],
    ]);

    $this->post(route('parent.checkin.complete', $this->studentProfile->id), [
        'completed_items' => [
            ['canonical_topic_id' => fake()->uuid(), 'type' => 'verification', 'completed' => true],
        ],
    ])->assertRedirect(route('parent.children.dashboard', $this->studentProfile));

    $session->refresh();
    expect($session->status)->toBe(CheckInSessionStatus::Completed);
    expect($session->completed_at)->not->toBeNull();
});

test('complete validates required fields', function () {
    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $this->link->id,
        'session_date' => now()->toDateString(),
    ]);

    $this->post(route('parent.checkin.complete', $this->studentProfile->id), [])
        ->assertSessionHasErrors('completed_items');
});

test('complete validates item type enum', function () {
    ParentCheckInSession::factory()->create([
        'parent_child_link_id' => $this->link->id,
        'session_date' => now()->toDateString(),
    ]);

    $this->post(route('parent.checkin.complete', $this->studentProfile->id), [
        'completed_items' => [
            ['canonical_topic_id' => fake()->uuid(), 'type' => 'invalid_type', 'completed' => true],
        ],
    ])->assertSessionHasErrors('completed_items.0.type');
});

test('parent can view read-together content', function () {
    $topic = CanonicalTopic::factory()->create([
        'simplified_content' => ['type' => 'doc', 'content' => []],
        'parent_verification_kit' => ['key_concepts' => ['c1'], 'true_false' => [], 'explain_prompt' => 'E'],
    ]);

    $this->get(route('parent.checkin.read-together', [$this->studentProfile->id, $topic->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('parent/check-in/read-together')
            ->has('child')
            ->has('content')
        );
});

test('read-together returns 404 for nonexistent topic', function () {
    $this->get(route('parent.checkin.read-together', [$this->studentProfile->id, '00000000-0000-0000-0000-000000000000']))
        ->assertNotFound();
});

test('read-together renders page even when topic has null content', function () {
    $topic = CanonicalTopic::factory()->create([
        'simplified_content' => null,
        'content' => null,
    ]);

    $this->get(route('parent.checkin.read-together', [$this->studentProfile->id, $topic->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('parent/check-in/read-together'));
});

test('parent can view study-as-child page', function () {
    $this->get(route('parent.study-as-child', $this->studentProfile->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('parent/study-as-child')
            ->has('context')
        );
});

test('parent cannot complete check-in for unlinked child', function () {
    $otherChild = StudentProfile::factory()->create();

    $this->post(route('parent.checkin.complete', $otherChild->id), [
        'completed_items' => [
            ['canonical_topic_id' => fake()->uuid(), 'type' => 'verification', 'completed' => true],
        ],
    ])->assertForbidden();
});

test('parent cannot access unlinked child check-in', function () {
    $otherChild = StudentProfile::factory()->create();

    $this->get(route('parent.checkin.show', $otherChild->id))
        ->assertForbidden();
});

test('parent cannot access unlinked child read-together', function () {
    $otherChild = StudentProfile::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    $this->get(route('parent.checkin.read-together', [$otherChild->id, $topic->id]))
        ->assertForbidden();
});

test('parent cannot access unlinked child study-as-child', function () {
    $otherChild = StudentProfile::factory()->create();

    $this->get(route('parent.study-as-child', $otherChild->id))
        ->assertForbidden();
});

test('student user cannot access check-in routes', function () {
    $student = User::factory()->create();
    StudentProfile::factory()->for($student)->create();

    $this->actingAs($student)
        ->get(route('parent.checkin.show', $this->studentProfile->id))
        ->assertForbidden();
});
