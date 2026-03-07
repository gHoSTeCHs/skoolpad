<?php

use App\Enums\PracticeMode;
use App\Enums\SpacedRepetitionStatus;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionTopicLink;
use App\Models\SchemeOfWorkItem;
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

it('index shows subjects for secondary students', function () {
    $this->profile->delete();

    $secondaryProfile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->user->id,
    ]);

    $levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $secondaryProfile->education_level_id,
    ]);

    $response = $this->get(route('review-queue.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('isSecondary', true)
        ->has('enrolledSubjects', 1)
        ->where('enrolledSubjects.0.subject_name', $levelSubject->curriculumSubject->name)
    );
});

it('index filters by level subject for secondary students', function () {
    $this->profile->delete();

    $secondaryProfile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->user->id,
    ]);

    $topic1 = CanonicalTopic::factory()->create();
    $topic2 = CanonicalTopic::factory()->create();

    $subject1 = LevelSubject::factory()->create([
        'education_level_id' => $secondaryProfile->education_level_id,
    ]);
    $subject2 = LevelSubject::factory()->create([
        'education_level_id' => $secondaryProfile->education_level_id,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $subject1->id,
        'canonical_topic_id' => $topic1->id,
    ]);
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $subject2->id,
        'canonical_topic_id' => $topic2->id,
    ]);

    $question1 = Question::factory()->create(['institution_course_id' => null, 'is_published' => true]);
    $question2 = Question::factory()->create(['institution_course_id' => null, 'is_published' => true]);
    QuestionTopicLink::factory()->create(['question_id' => $question1->id, 'canonical_topic_id' => $topic1->id]);
    QuestionTopicLink::factory()->create(['question_id' => $question2->id, 'canonical_topic_id' => $topic2->id]);

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $question1->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $question2->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $response = $this->get(route('review-queue.index', ['subject' => $subject1->id]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('dueItems', 1)
        ->where('selectedSubjectId', $subject1->id)
    );
});

it('start filters due items by level subject for secondary students', function () {
    $this->profile->delete();

    $secondaryProfile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->user->id,
    ]);

    $topic1 = CanonicalTopic::factory()->create();
    $topic2 = CanonicalTopic::factory()->create();

    $subject1 = LevelSubject::factory()->create([
        'education_level_id' => $secondaryProfile->education_level_id,
    ]);
    $subject2 = LevelSubject::factory()->create([
        'education_level_id' => $secondaryProfile->education_level_id,
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $subject1->id,
        'canonical_topic_id' => $topic1->id,
    ]);
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $subject2->id,
        'canonical_topic_id' => $topic2->id,
    ]);

    $question1 = Question::factory()->create(['institution_course_id' => null, 'is_published' => true]);
    $question2 = Question::factory()->create(['institution_course_id' => null, 'is_published' => true]);
    QuestionTopicLink::factory()->create(['question_id' => $question1->id, 'canonical_topic_id' => $topic1->id]);
    QuestionTopicLink::factory()->create(['question_id' => $question2->id, 'canonical_topic_id' => $topic2->id]);

    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $question1->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $question2->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $response = $this->post(route('review-queue.start'), [
        'level_subject_id' => $subject1->id,
    ]);

    $response->assertRedirect();
    $session = PracticeSession::where('user_id', $this->user->id)->first();
    expect($session)->not->toBeNull();
    expect($session->mode)->toBe(PracticeMode::Review);
    expect($session->question_count)->toBe(1);
    expect($session->question_ids)->toContain($question1->id);
    expect($session->question_ids)->not->toContain($question2->id);
    expect($session->level_subject_id)->toBe($subject1->id);
});

it('start rejects level subject from different education level', function () {
    $this->profile->delete();

    $secondaryProfile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->user->id,
    ]);

    $otherSubject = LevelSubject::factory()->create();

    $topic = CanonicalTopic::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $otherSubject->id,
        'canonical_topic_id' => $topic->id,
    ]);
    $question = Question::factory()->create(['institution_course_id' => null, 'is_published' => true]);
    QuestionTopicLink::factory()->create(['question_id' => $question->id, 'canonical_topic_id' => $topic->id]);
    SpacedRepetitionItem::factory()->create([
        'user_id' => $this->user->id,
        'question_id' => $question->id,
        'status' => SpacedRepetitionStatus::Active,
        'next_review_at' => today()->toDateString(),
    ]);

    $response = $this->post(route('review-queue.start'), [
        'level_subject_id' => $otherSubject->id,
    ]);

    $response->assertForbidden();
});
