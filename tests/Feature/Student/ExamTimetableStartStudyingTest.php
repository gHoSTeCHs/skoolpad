<?php

use App\Enums\TopicWeight;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\ExamTimetableEntry;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionTopicLink;
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
        'weight' => TopicWeight::Core,
    ]);

    $this->actingAs($this->user);
});

it('redirects to topic read page when first item action is read', function () {
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'sort_order' => 1,
        'path' => '1',
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $response = $this->post(route('exam-timetable.start-studying'));

    $response->assertRedirect(route('topics.read', $this->topic->id));
});

it('creates practice session and redirects when first item is practice', function () {
    $block = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'sort_order' => 1,
        'path' => '1',
    ]);
    \App\Models\BlockCompletion::factory()->create([
        'user_id' => $this->user->id,
        'content_block_id' => $block->id,
    ]);

    $session = \App\Models\PracticeSession::factory()->create(['user_id' => $this->user->id]);
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
    ]);
    QuestionTopicLink::factory()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $this->topic->id,
    ]);
    for ($i = 0; $i < 3; $i++) {
        \App\Models\PracticeAnswer::factory()->create([
            'practice_session_id' => $session->id,
            'question_id' => $question->id,
            'is_correct' => false,
        ]);
    }

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $response = $this->post(route('exam-timetable.start-studying'));

    $response->assertRedirect();
    expect($response->getTargetUrl())->toContain('practice');

    $this->assertDatabaseHas('practice_sessions', [
        'user_id' => $this->user->id,
    ]);
});

it('redirects back with message when no active entries', function () {
    $response = $this->post(route('exam-timetable.start-studying'));

    $response->assertRedirect();
    $response->assertSessionHas('error');
});

it('rejects entry_id belonging to another user', function () {
    $otherProfile = StudentProfile::factory()->create();
    $otherUser = $otherProfile->user;

    $otherEntry = ExamTimetableEntry::factory()->create([
        'user_id' => $otherUser->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    ExamTimetableEntry::factory()->create([
        'user_id' => $this->user->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(5),
    ]);

    $response = $this->post(route('exam-timetable.start-studying'), [
        'entry_id' => $otherEntry->id,
    ]);

    $response->assertForbidden();
});

it('prevents unauthenticated access', function () {
    \Auth::logout();

    $response = $this->post(route('exam-timetable.start-studying'));

    $response->assertRedirect(route('login'));
});

it('redirects to onboarding when no profile exists', function () {
    $userWithoutProfile = \App\Models\User::factory()->create();

    $response = $this->actingAs($userWithoutProfile)
        ->post(route('exam-timetable.start-studying'));

    $response->assertRedirect(route('onboarding.index'));
});
