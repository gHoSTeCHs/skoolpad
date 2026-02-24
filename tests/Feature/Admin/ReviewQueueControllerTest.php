<?php

use App\Enums\ContentSubmissionStatus;
use App\Enums\ContentSubmissionType;
use App\Enums\UserRole;
use App\Models\CanonicalTopic;
use App\Models\ContentSubmission;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => UserRole::SuperAdmin]);
});

test('index renders with all required props', function () {
    ContentSubmission::factory()->create(['status' => ContentSubmissionStatus::Pending]);

    $this->actingAs($this->admin)
        ->get(route('admin.review-queue.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/review-queue/index')
            ->has('submissions.data')
            ->has('submissions.meta')
            ->has('filters')
            ->has('submission_types')
            ->has('statuses')
        );
});

test('index defaults to pending filter', function () {
    ContentSubmission::factory()->create(['status' => ContentSubmissionStatus::Pending]);
    ContentSubmission::factory()->approved()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.review-queue.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('submissions.data', 1)
        );
});

test('index filters by submission type', function () {
    ContentSubmission::factory()->create([
        'submission_type' => ContentSubmissionType::Question,
        'status' => ContentSubmissionStatus::Pending,
    ]);
    ContentSubmission::factory()->create([
        'submission_type' => ContentSubmissionType::Correction,
        'status' => ContentSubmissionStatus::Pending,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.review-queue.index', ['submission_type' => 'question']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('submissions.data', 1)
            ->where('submissions.data.0.submission_type', 'question')
        );
});

test('show renders submission details', function () {
    $submission = ContentSubmission::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.review-queue.show', $submission))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/review-queue/show')
            ->has('submission')
            ->where('submission.id', $submission->id)
        );
});

test('approve changes status to approved', function () {
    $submission = ContentSubmission::factory()->create([
        'status' => ContentSubmissionStatus::Pending,
        'submission_type' => ContentSubmissionType::Correction,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.review-queue.approve', $submission))
        ->assertRedirect();

    $submission->refresh();
    expect($submission->status)->toBe(ContentSubmissionStatus::Approved)
        ->and($submission->reviewer_id)->toBe($this->admin->id)
        ->and($submission->reviewed_at)->not->toBeNull();
});

test('reject requires reviewer_notes', function () {
    $submission = ContentSubmission::factory()->create(['status' => ContentSubmissionStatus::Pending]);

    $this->actingAs($this->admin)
        ->post(route('admin.review-queue.reject', $submission), [])
        ->assertSessionHasErrors('reviewer_notes');
});

test('reject saves notes and changes status', function () {
    $submission = ContentSubmission::factory()->create(['status' => ContentSubmissionStatus::Pending]);

    $this->actingAs($this->admin)
        ->post(route('admin.review-queue.reject', $submission), [
            'reviewer_notes' => 'Content is not accurate.',
        ])
        ->assertRedirect();

    $submission->refresh();
    expect($submission->status)->toBe(ContentSubmissionStatus::Rejected)
        ->and($submission->reviewer_notes)->toBe('Content is not accurate.')
        ->and($submission->reviewer_id)->toBe($this->admin->id);
});

test('cannot approve already-reviewed submission', function () {
    $submission = ContentSubmission::factory()->approved()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.review-queue.approve', $submission))
        ->assertStatus(500);
});

test('transcribe creates questions with options', function () {
    $submission = ContentSubmission::factory()->create([
        'submission_type' => ContentSubmissionType::PastQuestionUpload,
        'status' => ContentSubmissionStatus::Pending,
    ]);

    $course = InstitutionCourse::factory()->create();
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);

    $this->actingAs($this->admin)
        ->post(route('admin.review-queue.transcribe', $submission), [
            'questions' => [
                [
                    'institution_course_id' => $course->id,
                    'question_type' => 'mcq',
                    'content' => 'What is 2+2?',
                    'year' => 2024,
                    'semester' => 'first',
                    'difficulty_level' => 'easy',
                    'topic_id' => $topic->id,
                    'options' => [
                        ['content' => '3', 'is_correct' => false],
                        ['content' => '4', 'is_correct' => true],
                    ],
                ],
            ],
        ])
        ->assertRedirect(route('admin.review-queue.uploads'));

    expect(Question::count())->toBe(1);

    $question = Question::first();
    expect($question->content)->toBe('What is 2+2?')
        ->and($question->options)->toHaveCount(2)
        ->and($question->topicLinks)->toHaveCount(1);

    $submission->refresh();
    expect($submission->status)->toBe(ContentSubmissionStatus::Approved);
});

test('guests cannot access review queue', function () {
    $this->get(route('admin.review-queue.index'))
        ->assertRedirect(route('login'));
});

test('content reviewer can approve submissions', function () {
    $reviewer = User::factory()->create(['role' => UserRole::ContentReviewer]);
    $submission = ContentSubmission::factory()->create([
        'status' => ContentSubmissionStatus::Pending,
        'submission_type' => ContentSubmissionType::Correction,
    ]);

    $this->actingAs($reviewer)
        ->post(route('admin.review-queue.approve', $submission))
        ->assertRedirect();

    $submission->refresh();
    expect($submission->status)->toBe(ContentSubmissionStatus::Approved);
});

test('uploads page renders with past question uploads only', function () {
    ContentSubmission::factory()->create([
        'submission_type' => ContentSubmissionType::PastQuestionUpload,
        'status' => ContentSubmissionStatus::Pending,
    ]);
    ContentSubmission::factory()->create([
        'submission_type' => ContentSubmissionType::Question,
        'status' => ContentSubmissionStatus::Pending,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.review-queue.uploads'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/review-queue/uploads')
            ->has('submissions.data', 1)
            ->has('institutions')
            ->has('enum_options')
        );
});
