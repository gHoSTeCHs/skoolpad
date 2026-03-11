<?php

use App\Models\CanonicalTopic;
use App\Models\Discipline;
use App\Models\InstitutionCourse;
use App\Models\StudentNote;
use App\Models\StudentProfile;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->profile = StudentProfile::factory()->create();
    $this->user = $this->profile->user;
    $this->actingAs($this->user);
});

it('renders the search page', function () {
    $response = $this->get(route('search.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('search/index'));
});

it('returns empty results for short queries', function () {
    $response = $this->getJson(route('api.search', ['q' => 'a']));

    $response->assertOk();
    $response->assertJson([
        'topics' => [],
        'courses' => [],
        'questions' => [],
        'notes' => [],
        'total' => 0,
    ]);
});

it('returns empty results for empty query', function () {
    $response = $this->getJson(route('api.search', ['q' => '']));

    $response->assertOk();
    $response->assertJson(['total' => 0]);
});

it('searches published topics by title', function () {
    $discipline = Discipline::factory()->create();
    CanonicalTopic::factory()->create([
        'title' => 'Binary Search Trees',
        'discipline_id' => $discipline->id,
        'is_published' => true,
    ]);
    CanonicalTopic::factory()->create([
        'title' => 'Linked Lists',
        'discipline_id' => $discipline->id,
        'is_published' => true,
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'Binary Search']));

    $response->assertOk();
    $response->assertJsonCount(1, 'topics');
    expect($response->json('topics.0.title'))->toBe('Binary Search Trees');
    expect($response->json('topics.0.type'))->toBe('topic');
});

it('excludes unpublished topics from results', function () {
    $discipline = Discipline::factory()->create();
    CanonicalTopic::factory()->create([
        'title' => 'Sorting Algorithms',
        'discipline_id' => $discipline->id,
        'is_published' => false,
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'Sorting']));

    $response->assertOk();
    $response->assertJsonCount(0, 'topics');
});

it('searches courses by code and title', function () {
    $course = InstitutionCourse::factory()->create([
        'course_code' => 'CSC 201',
        'course_title' => 'Data Structures and Algorithms',
        'institution_id' => $this->profile->institution_id,
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'CSC 201']));

    $response->assertOk();
    $response->assertJsonCount(1, 'courses');
    expect($response->json('courses.0.title'))->toBe('CSC 201');
    expect($response->json('courses.0.type'))->toBe('course');
});

it('searches user notes only for the authenticated user', function () {
    StudentNote::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'My study notes on recursion',
    ]);

    $otherProfile = StudentProfile::factory()->create();
    StudentNote::factory()->create([
        'user_id' => $otherProfile->user->id,
        'title' => 'Someone else notes on recursion',
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'recursion']));

    $response->assertOk();
    $response->assertJsonCount(1, 'notes');
    expect($response->json('notes.0.title'))->toBe('My study notes on recursion');
    expect($response->json('notes.0.type'))->toBe('note');
});

it('returns total count across all result types', function () {
    $discipline = Discipline::factory()->create();
    CanonicalTopic::factory()->create([
        'title' => 'Graph Algorithms Overview',
        'discipline_id' => $discipline->id,
        'is_published' => true,
    ]);

    StudentNote::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Graph Algorithms notes',
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'Graph Algorithms']));

    $response->assertOk();
    expect($response->json('total'))->toBeGreaterThanOrEqual(2);
});

it('returns results with correct shape', function () {
    $discipline = Discipline::factory()->create();
    CanonicalTopic::factory()->create([
        'title' => 'Hash Tables',
        'discipline_id' => $discipline->id,
        'is_published' => true,
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'Hash Tables']));

    $response->assertOk();
    $response->assertJsonStructure([
        'topics' => [['id', 'title', 'subtitle', 'description', 'type', 'url']],
        'courses',
        'questions',
        'notes',
        'total',
    ]);
});

it('prevents unauthenticated access to search', function () {
    auth()->logout();

    $response = $this->getJson(route('api.search', ['q' => 'test']));

    $response->assertUnauthorized();
});
