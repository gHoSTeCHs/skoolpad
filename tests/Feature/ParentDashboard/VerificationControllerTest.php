<?php

use App\Enums\VerificationResult;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->parentUser = User::factory()->parent()->create();
    $this->parentProfile = ParentProfile::factory()->create(['user_id' => $this->parentUser->id]);
    $this->link = ParentChildLink::factory()->active()->create(['parent_profile_id' => $this->parentProfile->id]);
    $this->studentProfile = $this->link->studentProfile;
    $this->actingAs($this->parentUser);
});

test('parent can view verification queue', function () {
    $this->get(route('parent.verification.index', $this->studentProfile->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('parent/verification/index')
            ->has('queue')
            ->has('stats')
            ->has('child')
        );
});

test('parent can view verification session for topic with kit', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => [
            'parent_briefing' => 'About cells.',
            'key_concepts' => ['Cell wall'],
            'true_false' => [['statement' => 'Test', 'answer' => true, 'explanation' => 'Because']],
            'explain_prompt' => 'Explain cells.',
        ],
    ]);

    $this->get(route('parent.verification.show', [$this->studentProfile->id, $topic->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('parent/verification/show')
            ->has('kit')
            ->has('child')
        );
});

test('show returns 404 for topic without verification kit', function () {
    $topic = CanonicalTopic::factory()->create(['parent_verification_kit' => null]);

    $this->get(route('parent.verification.show', [$this->studentProfile->id, $topic->id]))
        ->assertNotFound();
});

test('parent can submit verification', function () {
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => [], 'true_false' => [], 'explain_prompt' => ''],
    ]);

    $this->post(route('parent.verification.store', [$this->studentProfile->id, $topic->id]), [
        'responses' => ['explain_checklist' => ['concepts_checked' => [0, 1]]],
        'overall_result' => VerificationResult::Understood->value,
        'notes' => 'Great understanding.',
    ])->assertRedirect(route('parent.verification.index', $this->studentProfile->id));

    $this->assertDatabaseHas('verification_attempts', [
        'parent_child_link_id' => $this->link->id,
        'canonical_topic_id' => $topic->id,
        'overall_result' => VerificationResult::Understood->value,
    ]);
});

test('store validates required responses field', function () {
    $topic = CanonicalTopic::factory()->create();

    $this->post(route('parent.verification.store', [$this->studentProfile->id, $topic->id]), [
        'overall_result' => VerificationResult::Understood->value,
    ])->assertSessionHasErrors('responses');
});

test('store validates required overall_result field', function () {
    $topic = CanonicalTopic::factory()->create();

    $this->post(route('parent.verification.store', [$this->studentProfile->id, $topic->id]), [
        'responses' => [],
    ])->assertSessionHasErrors('overall_result');
});

test('store validates overall_result enum value', function () {
    $topic = CanonicalTopic::factory()->create();

    $this->post(route('parent.verification.store', [$this->studentProfile->id, $topic->id]), [
        'responses' => [],
        'overall_result' => 'invalid_result',
    ])->assertSessionHasErrors('overall_result');
});

test('parent cannot access unlinked child verification queue', function () {
    $otherChild = StudentProfile::factory()->create();

    $this->get(route('parent.verification.index', $otherChild->id))
        ->assertForbidden();
});

test('parent cannot view verification for unlinked child topic', function () {
    $otherChild = StudentProfile::factory()->create();
    $topic = CanonicalTopic::factory()->create([
        'parent_verification_kit' => ['key_concepts' => ['c'], 'true_false' => [], 'explain_prompt' => 'E'],
    ]);

    $this->get(route('parent.verification.show', [$otherChild->id, $topic->id]))
        ->assertForbidden();
});

test('parent cannot submit verification for unlinked child', function () {
    $otherChild = StudentProfile::factory()->create();
    $topic = CanonicalTopic::factory()->create();

    $this->post(route('parent.verification.store', [$otherChild->id, $topic->id]), [
        'responses' => [],
        'overall_result' => VerificationResult::Understood->value,
    ])->assertForbidden();
});

test('student user cannot access verification routes', function () {
    $student = User::factory()->create();
    StudentProfile::factory()->for($student)->create();

    $this->actingAs($student)
        ->get(route('parent.verification.index', $this->studentProfile->id))
        ->assertForbidden();
});
