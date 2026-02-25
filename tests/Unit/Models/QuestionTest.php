<?php

use App\Models\CanonicalTopic;
use App\Models\Question;

uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class);

test('semester is cast to string not enum', function () {
    $question = Question::factory()->create(['semester' => 'first']);

    expect($question->semester)->toBe('first')
        ->and($question->semester)->not->toBeInstanceOf(App\Enums\Semester::class);
});

test('factory never generates both semester', function () {
    $course = App\Models\InstitutionCourse::factory()->create();
    $questions = Question::factory()->count(50)->create(['institution_course_id' => $course->id]);

    foreach ($questions as $question) {
        if ($question->semester !== null) {
            expect($question->semester)->toBeIn(['first', 'second']);
        }
    }
});

test('search scope uses full-text search', function () {
    if (DB::getDriverName() !== 'pgsql') {
        $this->markTestSkipped('Search scope requires PostgreSQL full-text search.');
    }

    $course = App\Models\InstitutionCourse::factory()->create();
    Question::factory()->create([
        'institution_course_id' => $course->id,
        'content' => 'What is binary search algorithm?',
    ]);

    $results = Question::search('binary')->get();

    expect($results)->toHaveCount(1);
});

test('renamed relationships work', function () {
    $question = Question::factory()->create();

    expect($question->answers())->toBeInstanceOf(Illuminate\Database\Eloquent\Relations\HasMany::class)
        ->and($question->topicLinks())->toBeInstanceOf(Illuminate\Database\Eloquent\Relations\HasMany::class);
});

test('canonicalTopics many-to-many works', function () {
    $question = Question::factory()->create();
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    $question->topicLinks()->create([
        'canonical_topic_id' => $topic->id,
        'is_primary' => true,
    ]);

    expect($question->canonicalTopics)->toHaveCount(1)
        ->and($question->canonicalTopics->first()->id)->toBe($topic->id);
});
