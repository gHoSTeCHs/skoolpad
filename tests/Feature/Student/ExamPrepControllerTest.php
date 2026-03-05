<?php

use App\Enums\PracticeMode;
use App\Enums\TopicWeight;
use App\Models\AssessmentType;
use App\Models\CanonicalTopic;
use App\Models\CourseTopicMapping;
use App\Models\ExamGoal;
use App\Models\GradingScale;
use App\Models\InstitutionCourse;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\QuestionPaper;
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

    $this->gradingScale = GradingScale::factory()->create();
    $this->assessmentType = AssessmentType::factory()->create([
        'grading_scale_id' => $this->gradingScale->id,
    ]);

    $this->goal = ExamGoal::factory()->create([
        'user_id' => $this->user->id,
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
        'exam_date' => now()->addDays(30),
        'is_active' => true,
    ]);

    $this->topic = CanonicalTopic::factory()->create();
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topic->id,
        'sequence_order' => 1,
        'weight' => TopicWeight::Core,
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

it('shows exam prep page with active goals and papers', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
    ]);
    Question::factory()->count(3)->create([
        'question_paper_id' => $paper->id,
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);

    $response = $this->get(route('practice.exam-prep'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('practice/exam-prep')
        ->has('goals', 1)
        ->has('papers')
    );
});

it('redirects when user has no active exam goals', function () {
    $this->goal->update(['is_active' => false]);

    $response = $this->get(route('practice.exam-prep'));

    $response->assertRedirect(route('practice.configure'));
});

it('starts full mock session from published paper', function () {
    $paper = QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
        'duration_minutes' => 120,
    ]);
    Question::factory()->count(5)->create([
        'question_paper_id' => $paper->id,
        'institution_course_id' => $this->course->id,
        'is_published' => true,
    ]);

    $response = $this->post(route('practice.exam-prep.start'), [
        'question_paper_id' => $paper->id,
    ]);

    $session = PracticeSession::first();
    $response->assertRedirect(route('practice.show', $session));
    expect($session->mode)->toBe(PracticeMode::FullMock);
    expect($session->question_paper_id)->toBe($paper->id);
    expect($session->assessment_type_id)->toBe($this->assessmentType->id);
    expect($session->question_count)->toBe(5);
});

it('rejects starting mock from unpublished paper', function () {
    $paper = QuestionPaper::factory()->create([
        'assessment_type_id' => $this->assessmentType->id,
        'institution_course_id' => $this->course->id,
        'is_published' => false,
    ]);

    $response = $this->post(route('practice.exam-prep.start'), [
        'question_paper_id' => $paper->id,
    ]);

    $response->assertForbidden();
});

it('validates paper belongs to user exam goal assessment type', function () {
    $otherAssessmentType = AssessmentType::factory()->create();
    $paper = QuestionPaper::factory()->published()->create([
        'assessment_type_id' => $otherAssessmentType->id,
    ]);

    $response = $this->post(route('practice.exam-prep.start'), [
        'question_paper_id' => $paper->id,
    ]);

    $response->assertForbidden();
});

it('returns daily plan JSON', function () {
    $response = $this->getJson(route('api.practice.exam-prep.daily'));

    $response->assertOk();
    $response->assertJsonStructure(['plan']);
    $response->assertJsonPath('plan.days_remaining', 30);
});

it('returns null daily plan when no exam date set', function () {
    $this->goal->update(['exam_date' => null]);

    $response = $this->getJson(route('api.practice.exam-prep.daily'));

    $response->assertOk();
    $response->assertJson(['plan' => null]);
});
