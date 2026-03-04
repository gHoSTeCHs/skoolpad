<?php

use App\Enums\SpacedRepetitionStatus;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\SpacedRepetitionItem;
use App\Models\StudentProfile;
use App\Services\SpacedRepetitionService;

beforeEach(function () {
    $this->service = app(SpacedRepetitionService::class);
    $this->profile = StudentProfile::factory()->create();
    $this->user = $this->profile->user;
    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    $this->question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
});

it('creates new spaced repetition item on first correct review', function () {
    $item = $this->service->scheduleReview($this->user, $this->question, true);

    expect($item)->toBeInstanceOf(SpacedRepetitionItem::class);
    expect($item->user_id)->toBe($this->user->id);
    expect($item->question_id)->toBe($this->question->id);
    expect($item->interval_days)->toBe(1);
    expect($item->repetition_count)->toBe(1);
    expect($item->status)->toBe(SpacedRepetitionStatus::Active);
    expect(SpacedRepetitionItem::count())->toBe(1);
});

it('increments interval on successive correct answers (1→3→7→21)', function () {
    $item = $this->service->scheduleReview($this->user, $this->question, true);
    expect($item->interval_days)->toBe(1);
    expect($item->repetition_count)->toBe(1);

    $item = $this->service->scheduleReview($this->user, $this->question, true);
    expect($item->interval_days)->toBe(3);
    expect($item->repetition_count)->toBe(2);

    $item = $this->service->scheduleReview($this->user, $this->question, true);
    expect($item->interval_days)->toBe(7);
    expect($item->repetition_count)->toBe(3);

    $item = $this->service->scheduleReview($this->user, $this->question, true);
    expect($item->interval_days)->toBe(21);
    expect($item->status)->toBe(SpacedRepetitionStatus::Graduated);
});

it('resets interval and rep count to initial values on incorrect answer', function () {
    $this->service->scheduleReview($this->user, $this->question, true);
    $this->service->scheduleReview($this->user, $this->question, true);

    $item = $this->service->scheduleReview($this->user, $this->question, false);

    expect($item->interval_days)->toBe(1);
    expect($item->repetition_count)->toBe(0);
    expect($item->status)->toBe(SpacedRepetitionStatus::Active);
    expect(SpacedRepetitionItem::count())->toBe(1);
});

it('graduates item after four consecutive correct answers', function () {
    $this->service->scheduleReview($this->user, $this->question, true);
    $this->service->scheduleReview($this->user, $this->question, true);
    $this->service->scheduleReview($this->user, $this->question, true);
    $item = $this->service->scheduleReview($this->user, $this->question, true);

    expect($item->status)->toBe(SpacedRepetitionStatus::Graduated);
    expect($item->repetition_count)->toBe(4);
});

it('getDueItems returns only items due today or earlier', function () {
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->question->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $otherQuestion = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $otherQuestion->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->addDays(3)->toDateString(),
    ]);

    $dueItems = $this->service->getDueItems($this->user);

    expect($dueItems)->toHaveCount(1);
    expect($dueItems->first()->question_id)->toBe($this->question->id);
});

it('getDueItems filters by course when provided', function () {
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->profile->institution_id,
    ]);
    $otherQuestion = Question::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'is_published' => true,
    ]);

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->question->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $otherQuestion->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $allItems = $this->service->getDueItems($this->user);
    expect($allItems)->toHaveCount(2);

    $filteredItems = $this->service->getDueItems($this->user, $this->course);
    expect($filteredItems)->toHaveCount(1);
    expect($filteredItems->first()->question_id)->toBe($this->question->id);
});

it('getUpcomingCounts returns correct 14-day forecast', function () {
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->question->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $otherQuestion = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $otherQuestion->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->addDays(3)->toDateString(),
    ]);

    $counts = $this->service->getUpcomingCounts($this->user, 14);

    expect($counts)->toHaveCount(14);
    expect($counts[0])->toBe(1);
    expect($counts[1])->toBe(0);
    expect($counts[2])->toBe(0);
    expect($counts[3])->toBe(1);
});

it('getDueCount returns correct number of due items', function () {
    $questions = Question::factory()->count(3)->create([
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);

    foreach ($questions as $q) {
        SpacedRepetitionItem::factory()->create([
            'user_id' => $this->user->id,
            'question_id' => $q->id,
            'status' => SpacedRepetitionStatus::Active,
            'next_review_at' => today()->toDateString(),
        ]);
    }

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $this->question->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->addDay()->toDateString(),
    ]);

    expect($this->service->getDueCount($this->user))->toBe(3);
});
