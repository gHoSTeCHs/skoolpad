<?php

use App\Enums\PracticeMode;
use App\Enums\SpacedRepetitionStatus;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionTopicLink;
use App\Models\SpacedRepetitionItem;
use App\Models\StudentCourse;
use App\Models\StudentProfile;

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
    $this->topic = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topic->id,
        'sequence_order' => 1,
    ]);

    $this->questions = Question::factory()->count(5)->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    foreach ($this->questions as $q) {
        QuestionTopicLink::factory()->create([
            'question_id' => $q->id,
            'canonical_topic_id' => $this->topic->id,
        ]);
    }

    $this->actingAs($this->user);
});

it('index returns due count and items with strength indicators', function () {
    foreach ($this->questions->take(3) as $q) {
        SpacedRepetitionItem::factory()->create([
            'user_id' => $this->user->id,
            'question_id' => $q->id,
            'status' => SpacedRepetitionStatus::Active,
            'next_review_at' => today()->toDateString(),
            'interval_days' => 1,
        ]);
    }

    $response = $this->get(route('review-queue.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('review-queue/index')
        ->has('dueItems', 3)
        ->where('dueCount', 3)
        ->has('calendar')
        ->has('enrolledCourses')
    );
});

it('index filters by course', function () {
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    $otherQuestion = Question::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'is_published' => true,
    ]);

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->questions->first()->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $otherQuestion->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $response = $this->get(route('review-queue.index', ['course' => $this->course->id]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('dueItems', 1)
    );
});

it('index handles empty queue gracefully', function () {
    $response = $this->get(route('review-queue.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('dueCount', 0)
        ->has('dueItems', 0)
    );
});

it('start creates review session with due items only', function () {
    foreach ($this->questions->take(3) as $q) {
        SpacedRepetitionItem::factory()->create([
            'user_id' => $this->user->id,
            'question_id' => $q->id,
            'status' => SpacedRepetitionStatus::Active,
            'next_review_at' => today()->toDateString(),
        ]);
    }

    $response = $this->post(route('review-queue.start'));

    $response->assertRedirect();

    $session = PracticeSession::where('user_id', $this->user->id)->first();
    expect($session)->not->toBeNull();
    expect($session->mode)->toBe(PracticeMode::Review);
    expect($session->question_count)->toBe(3);
    expect($session->is_resumable)->toBeTrue();
});

it('start redirects when no items due', function () {
    $response = $this->post(route('review-queue.start'));

    $response->assertRedirect(route('review-queue.index'));
    expect(PracticeSession::count())->toBe(0);
});

it('start filters by course when provided', function () {
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    $otherQuestion = Question::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'is_published' => true,
    ]);

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->questions->first()->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $otherQuestion->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $response = $this->post(route('review-queue.start'), [
        'course_id' => $this->course->id,
    ]);

    $response->assertRedirect();
    $session = PracticeSession::where('user_id', $this->user->id)->first();
    expect($session->question_count)->toBe(1);
    expect($session->question_ids)->toContain($this->questions->first()->id);
});

it('calendar returns 14-day forecast', function () {
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->questions->first()->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->addDays(2)->toDateString(),
    ]);

    $response = $this->getJson(route('api.review-queue.calendar'));

    $response->assertOk();
    $response->assertJsonStructure(['calendar']);
    $calendar = $response->json('calendar');
    expect($calendar)->toHaveCount(14);
    expect($calendar['2'])->toBe(1);
});

it('start rejects unenrolled course', function () {
    $unenrolledCourse = InstitutionCourse::factory()->create();

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->questions->first()->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $response = $this->post(route('review-queue.start'), [
        'course_id' => $unenrolledCourse->id,
    ]);

    $response->assertForbidden();
});

it('index shows correct strength mapping', function () {
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->questions[0]->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
        'interval_days' => 1,
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->questions[1]->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
        'interval_days' => 3,
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->questions[2]->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
        'interval_days' => 21,
    ]);

    $response = $this->get(route('review-queue.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('dueItems', 3)
        ->where('dueItems.0.strength', fn ($s) => in_array($s, ['weak', 'growing', 'strong']))
    );
});
