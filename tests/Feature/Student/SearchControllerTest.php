<?php

use App\Models\CanonicalTopic;
use App\Models\Discipline;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\StudentNote;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

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

it('rejects short queries with validation error', function () {
    $response = $this->getJson(route('api.search', ['q' => 'a']));

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['q']);
});

it('rejects empty query with validation error', function () {
    $response = $this->getJson(route('api.search', ['q' => '']));

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['q']);
});

it('rejects missing query with validation error', function () {
    $response = $this->getJson(route('api.search'));

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['q']);
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
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

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
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

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
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

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
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

it('prevents unauthenticated access to search', function () {
    auth()->logout();

    $response = $this->getJson(route('api.search', ['q' => 'test']));

    $response->assertUnauthorized();
});

it('redirects non-onboarded users to onboarding', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('search.index'));

    $response->assertRedirect(route('onboarding.index'));
});

it('redirects non-onboarded users from search api to onboarding', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson(route('api.search', ['q' => 'test']));

    $response->assertRedirect(route('onboarding.index'));
});

it('rejects queries exceeding max length', function () {
    $response = $this->getJson(route('api.search', ['q' => str_repeat('a', 256)]));

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['q']);
});

it('handles special characters in query without errors', function () {
    $response = $this->getJson(route('api.search', ['q' => "'; DROP TABLE users; --"]));

    $response->assertOk();
    $response->assertJsonStructure(['topics', 'courses', 'questions', 'notes', 'total']);
});

it('handles ILIKE wildcard characters in query', function () {
    StudentNote::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Regular note title',
    ]);

    $response = $this->getJson(route('api.search', ['q' => '%%']));

    $response->assertOk();
    $response->assertJsonCount(0, 'notes');
});

it('excludes courses from other institutions', function () {
    $otherInstitution = Institution::factory()->create();
    InstitutionCourse::factory()->create([
        'course_code' => 'PHY 101',
        'course_title' => 'Physics Fundamentals',
        'institution_id' => $otherInstitution->id,
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'PHY 101']));

    $response->assertOk();
    $response->assertJsonCount(0, 'courses');
});

it('returns empty courses for students without institution', function () {
    $profile = StudentProfile::factory()->create(['institution_id' => null]);

    InstitutionCourse::factory()->create([
        'course_code' => 'MTH 101',
        'course_title' => 'Mathematics',
    ]);

    $response = $this->actingAs($profile->user)
        ->getJson(route('api.search', ['q' => 'MTH 101']));

    $response->assertOk();
    $response->assertJsonCount(0, 'courses');
});

it('searches published questions from institution courses', function () {
    Question::factory()->create([
        'content' => 'What is photosynthesis process',
        'institution_course_id' => InstitutionCourse::factory()->create([
            'institution_id' => $this->profile->institution_id,
        ]),
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'photosynthesis']));

    $response->assertOk();
    $response->assertJsonCount(1, 'questions');
    expect($response->json('questions.0.type'))->toBe('question');
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

it('includes exam-subject questions for institution-scoped students', function () {
    Question::factory()->forExamSubject()->create([
        'content' => 'What is osmosis in biology',
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'osmosis']));

    $response->assertOk();
    $response->assertJsonCount(1, 'questions');
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

it('excludes questions from other institutions courses', function () {
    $otherInstitution = Institution::factory()->create();
    Question::factory()->create([
        'content' => 'Explain quantum entanglement theory',
        'institution_course_id' => InstitutionCourse::factory()->create([
            'institution_id' => $otherInstitution->id,
        ]),
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'quantum entanglement']));

    $response->assertOk();
    $response->assertJsonCount(0, 'questions');
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

it('excludes draft questions from search results', function () {
    Question::factory()->draft()->create([
        'content' => 'What is thermodynamics draft',
        'institution_course_id' => InstitutionCourse::factory()->create([
            'institution_id' => $this->profile->institution_id,
        ]),
    ]);

    $response = $this->getJson(route('api.search', ['q' => 'thermodynamics']));

    $response->assertOk();
    $response->assertJsonCount(0, 'questions');
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');

it('shows only exam-subject questions for students without institution', function () {
    $profile = StudentProfile::factory()->create(['institution_id' => null]);

    Question::factory()->forExamSubject()->create([
        'content' => 'What is cellular respiration process',
    ]);

    Question::factory()->create([
        'content' => 'What is cellular division mitosis',
    ]);

    $response = $this->actingAs($profile->user)
        ->getJson(route('api.search', ['q' => 'cellular']));

    $response->assertOk();
    $response->assertJsonCount(1, 'questions');
})->skip(fn () => DB::getDriverName() !== 'pgsql', 'Full-text search requires PostgreSQL');
