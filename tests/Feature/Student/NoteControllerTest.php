<?php

use App\Models\CanonicalTopic;
use App\Models\InstitutionCourse;
use App\Models\StudentCourse;
use App\Models\StudentNote;
use App\Models\StudentProfile;
use App\Models\User;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

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
    $this->actingAs($this->user);
});

it('lists notes for authenticated tertiary student', function () {
    StudentNote::factory()->count(3)->create(['user_id' => $this->user->id]);

    $response = $this->get(route('notes.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('notes/index')
        ->has('notes.data', 3)
        ->where('isSecondary', false)
        ->has('enrolledCourses')
        ->has('filters')
    );
});

it('does not show other users notes', function () {
    $otherUser = User::factory()->create();
    StudentNote::factory()->count(2)->create(['user_id' => $otherUser->id]);
    StudentNote::factory()->create(['user_id' => $this->user->id]);

    $response = $this->get(route('notes.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('notes.data', 1)
    );
});

it('filters notes by search term', function () {
    StudentNote::factory()->create(['user_id' => $this->user->id, 'title' => 'Data Structures Review']);
    StudentNote::factory()->create(['user_id' => $this->user->id, 'title' => 'Algorithms Summary']);

    $response = $this->get(route('notes.index', ['search' => 'Data Structures']));

    $response->assertInertia(fn ($page) => $page
        ->has('notes.data', 1)
    );
});

it('filters notes by course', function () {
    StudentNote::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
    ]);
    StudentNote::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => null,
    ]);

    $response = $this->get(route('notes.index', ['course_id' => $this->course->id]));

    $response->assertInertia(fn ($page) => $page
        ->has('notes.data', 1)
    );
});

it('shows isSecondary true and empty notes for secondary student', function () {
    $secondaryProfile = StudentProfile::factory()->secondary()->create();
    $this->actingAs($secondaryProfile->user);

    $response = $this->get(route('notes.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('isSecondary', true)
        ->has('notes.data', 0)
    );
});

it('renders create page for tertiary student', function () {
    $response = $this->get(route('notes.create'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('notes/create')
        ->has('enrolledCourses')
    );
});

it('pre-fills topic context on create page', function () {
    $topic = CanonicalTopic::factory()->create();

    $response = $this->get(route('notes.create', ['topic_id' => $topic->id]));

    $response->assertInertia(fn ($page) => $page
        ->where('topicContext.id', $topic->id)
        ->where('topicContext.title', $topic->title)
    );
});

it('redirects secondary student from create page', function () {
    $secondaryProfile = StudentProfile::factory()->secondary()->create();
    $this->actingAs($secondaryProfile->user);

    $response = $this->get(route('notes.create'));

    $response->assertRedirect(route('notes.index'));
});

it('stores a note with valid data', function () {
    $topic = CanonicalTopic::factory()->create();

    $response = $this->post(route('notes.store'), [
        'title' => 'My Test Note',
        'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph']]],
        'is_pinned' => false,
        'canonical_topic_id' => $topic->id,
        'institution_course_id' => $this->course->id,
    ]);

    $note = StudentNote::query()->where('user_id', $this->user->id)->first();

    expect($note)->not->toBeNull();
    expect($note->title)->toBe('My Test Note');
    expect($note->canonical_topic_id)->toBe($topic->id);

    $response->assertRedirect(route('notes.show', $note));
});

it('rejects note creation with missing title', function () {
    $response = $this->post(route('notes.store'), [
        'content' => ['type' => 'doc', 'content' => []],
    ]);

    $response->assertSessionHasErrors(['title']);
});

it('rejects note creation with invalid canonical_topic_id', function () {
    $response = $this->post(route('notes.store'), [
        'title' => 'Test Note',
        'canonical_topic_id' => 'not-a-uuid',
    ]);

    $response->assertSessionHasErrors(['canonical_topic_id']);
});

it('rejects note creation with non-existent institution_course_id', function () {
    $response = $this->post(route('notes.store'), [
        'title' => 'Test Note',
        'institution_course_id' => fake()->uuid(),
    ]);

    $response->assertSessionHasErrors(['institution_course_id']);
});

it('rejects note creation for secondary student', function () {
    $secondaryProfile = StudentProfile::factory()->secondary()->create();
    $this->actingAs($secondaryProfile->user);

    $response = $this->post(route('notes.store'), [
        'title' => 'Should Not Be Created',
    ]);

    $response->assertForbidden();
});

it('shows a note for its owner', function () {
    $note = StudentNote::factory()->create(['user_id' => $this->user->id]);

    $response = $this->get(route('notes.show', $note));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('notes/show')
        ->where('note.id', $note->id)
        ->where('note.title', $note->title)
    );
});

it('forbids viewing another users note', function () {
    $otherUser = User::factory()->create();
    $note = StudentNote::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->get(route('notes.show', $note));

    $response->assertForbidden();
});

it('updates a note for its owner', function () {
    $note = StudentNote::factory()->create(['user_id' => $this->user->id]);

    $response = $this->put(route('notes.update', $note), [
        'title' => 'Updated Title',
        'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph']]],
        'is_pinned' => true,
    ]);

    $response->assertRedirect();

    $note->refresh();
    expect($note->title)->toBe('Updated Title');
    expect($note->is_pinned)->toBeTrue();
});

it('forbids updating another users note', function () {
    $otherUser = User::factory()->create();
    $note = StudentNote::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->put(route('notes.update', $note), [
        'title' => 'Hacked Title',
    ]);

    $response->assertForbidden();
});

it('rejects update with missing title', function () {
    $note = StudentNote::factory()->create(['user_id' => $this->user->id]);

    $response = $this->put(route('notes.update', $note), [
        'title' => '',
        'content' => null,
    ]);

    $response->assertSessionHasErrors(['title']);
});

it('rejects update with invalid canonical_topic_id', function () {
    $note = StudentNote::factory()->create(['user_id' => $this->user->id]);

    $response = $this->put(route('notes.update', $note), [
        'title' => 'Valid Title',
        'canonical_topic_id' => 'not-a-uuid',
    ]);

    $response->assertSessionHasErrors(['canonical_topic_id']);
});

it('rejects update with non-existent institution_course_id', function () {
    $note = StudentNote::factory()->create(['user_id' => $this->user->id]);

    $response = $this->put(route('notes.update', $note), [
        'title' => 'Valid Title',
        'institution_course_id' => fake()->uuid(),
    ]);

    $response->assertSessionHasErrors(['institution_course_id']);
});

it('deletes a note for its owner', function () {
    $note = StudentNote::factory()->create(['user_id' => $this->user->id]);

    $response = $this->delete(route('notes.destroy', $note));

    $response->assertRedirect(route('notes.index'));
    $this->assertDatabaseMissing('student_notes', ['id' => $note->id]);
});

it('forbids deleting another users note', function () {
    $otherUser = User::factory()->create();
    $note = StudentNote::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->delete(route('notes.destroy', $note));

    $response->assertForbidden();
    $this->assertDatabaseHas('student_notes', ['id' => $note->id]);
});

it('prevents unauthenticated access to notes', function () {
    auth()->logout();

    $response = $this->get(route('notes.index'));

    $response->assertRedirect(route('login'));
});

it('includes topic notes in topic show page for tertiary student', function () {
    $topic = CanonicalTopic::factory()->create();
    StudentNote::factory()->count(2)->create([
        'user_id' => $this->user->id,
        'canonical_topic_id' => $topic->id,
    ]);

    $response = $this->get(route('topics.show', $topic));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('topicNotes', 2)
        ->where('isSecondary', false)
    );
});

it('returns empty topic notes for secondary student', function () {
    $secondaryProfile = StudentProfile::factory()->secondary()->create();
    $this->actingAs($secondaryProfile->user);

    $topic = CanonicalTopic::factory()->create();

    $response = $this->get(route('topics.show', $topic));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('topicNotes', 0)
        ->where('isSecondary', true)
    );
});
