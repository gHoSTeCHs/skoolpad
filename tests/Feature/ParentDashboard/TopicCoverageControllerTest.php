<?php

use App\Enums\TopicCoverageStatus;
use App\Models\CanonicalTopic;
use App\Models\ParentChildLink;
use App\Models\ParentProfile;
use App\Models\StudentProfile;
use App\Models\User;

beforeEach(function () {
    $this->parentUser = User::factory()->parent()->create();
    $this->parentProfile = ParentProfile::factory()->create(['user_id' => $this->parentUser->id]);
    $this->link = ParentChildLink::factory()->active()->create(['parent_profile_id' => $this->parentProfile->id]);
    $this->topic = CanonicalTopic::factory()->create();
    $this->actingAs($this->parentUser);
});

test('parent can report topic as covered', function () {
    $this->post(route('parent.children.coverage.store', [
        'studentProfile' => $this->link->student_profile_id,
        'topic' => $this->topic->id,
    ]), [
        'status' => 'covered',
    ])->assertRedirect();

    $this->assertDatabaseHas('topic_coverage_status', [
        'parent_child_link_id' => $this->link->id,
        'canonical_topic_id' => $this->topic->id,
        'status' => TopicCoverageStatus::Covered->value,
    ]);
});

test('parent can report topic as not yet covered', function () {
    $this->post(route('parent.children.coverage.store', [
        'studentProfile' => $this->link->student_profile_id,
        'topic' => $this->topic->id,
    ]), [
        'status' => 'not_yet_covered',
    ])->assertRedirect();

    $this->assertDatabaseHas('topic_coverage_status', [
        'canonical_topic_id' => $this->topic->id,
        'status' => TopicCoverageStatus::NotYetCovered->value,
    ]);
});

test('parent can report topic as skipped', function () {
    $this->post(route('parent.children.coverage.store', [
        'studentProfile' => $this->link->student_profile_id,
        'topic' => $this->topic->id,
    ]), [
        'status' => 'skipped',
    ])->assertRedirect();

    $this->assertDatabaseHas('topic_coverage_status', [
        'canonical_topic_id' => $this->topic->id,
        'status' => TopicCoverageStatus::Skipped->value,
    ]);
});

test('coverage rejects invalid status value', function () {
    $this->post(route('parent.children.coverage.store', [
        'studentProfile' => $this->link->student_profile_id,
        'topic' => $this->topic->id,
    ]), [
        'status' => 'invalid_status',
    ])->assertSessionHasErrors('status');
});

test('coverage rejects missing status', function () {
    $this->post(route('parent.children.coverage.store', [
        'studentProfile' => $this->link->student_profile_id,
        'topic' => $this->topic->id,
    ]), [])->assertSessionHasErrors('status');
});

test('parent cannot report coverage for unlinked child', function () {
    $otherChild = StudentProfile::factory()->create();

    $this->post(route('parent.children.coverage.store', [
        'studentProfile' => $otherChild->id,
        'topic' => $this->topic->id,
    ]), [
        'status' => 'covered',
    ])->assertForbidden();
});

test('student user cannot report coverage', function () {
    $student = User::factory()->create();
    StudentProfile::factory()->for($student)->create();

    $this->actingAs($student)
        ->post(route('parent.children.coverage.store', [
            'studentProfile' => $this->link->student_profile_id,
            'topic' => $this->topic->id,
        ]), [
            'status' => 'covered',
        ])->assertForbidden();
});
