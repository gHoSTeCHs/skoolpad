<?php

use App\Models\CanonicalTopic;
use App\Models\ExamSubject;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionPaper;
use App\Models\QuestionTopicLink;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->institution = Institution::factory()->create(['is_active' => true]);
    $this->course = InstitutionCourse::factory()->for($this->institution)->create();
});

test('index returns correct counts and tab data for the library landing', function () {
    // 2 papers with questions
    $paperA = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => true]);
    $paperB = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id, 'is_published' => false]);
    $paperQ = Question::factory()->create(['question_paper_id' => $paperA->id, 'institution_course_id' => null]);
    QuestionAnswer::factory()->create(['question_id' => $paperQ->id, 'is_published' => true]);

    // 1 course-pool question (no paper, has institution_course)
    $poolCourse = InstitutionCourse::factory()->for($this->institution)->create();
    Question::factory()->create([
        'question_paper_id' => null,
        'institution_course_id' => $poolCourse->id,
        'exam_subject_id' => null,
    ]);

    // 1 exam-subject pool question
    $subject = ExamSubject::factory()->create();
    Question::factory()->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => $subject->id,
    ]);

    // 2 unattached questions
    Question::factory()->count(2)->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-library.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/question-library/index')
            ->where('counts.papers', 2)
            ->where('counts.course_pools', 1)
            ->where('counts.exam_subject_pools', 1)
            ->where('counts.unattached', 2)
            ->has('papers', 2)
            ->has('course_pools', 1)
            ->has('exam_subject_pools', 1)
            ->has('unattached_questions', 2)
        );
});

test('papers carry answer fill stats', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $q = Question::factory()->create(['question_paper_id' => $paper->id, 'institution_course_id' => null]);
    QuestionAnswer::factory()->quick()->create(['question_id' => $q->id, 'is_published' => true]);
    QuestionAnswer::factory()->create(['question_id' => $q->id, 'is_published' => false]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-library.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('papers.0', fn ($paper) => $paper
                ->where('answers_filled', 2)
                ->where('answers_published', 1)
                ->where('answers_total_slots', 3)
                ->etc()
            )
        );
});

test('search endpoint returns grouped results', function () {
    QuestionPaper::factory()->create([
        'institution_course_id' => $this->course->id,
        'title' => 'Advanced Algorithms Final',
    ]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.question-library.search', ['q' => 'Algorithms']))
        ->assertOk()
        ->assertJsonStructure([
            'results' => ['papers', 'course_pools', 'exam_pools', 'questions'],
        ])
        ->assertJsonPath('results.papers.0.title', 'Advanced Algorithms Final');
});

test('search returns empty groups when query is blank', function () {
    QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);

    $this->actingAs($this->admin)
        ->getJson(route('admin.question-library.search', ['q' => '']))
        ->assertOk()
        ->assertJsonPath('results.papers', [])
        ->assertJsonPath('results.course_pools', [])
        ->assertJsonPath('results.exam_pools', [])
        ->assertJsonPath('results.questions', []);
});

test('students cannot access the library', function () {
    $student = User::factory()->create();

    $this->actingAs($student)
        ->get(route('admin.question-library.index'))
        ->assertForbidden();
});

test('showCourse returns pool questions grouped by primary topic', function () {
    $topicA = CanonicalTopic::factory()->create(['title' => 'Memory Management']);
    $topicB = CanonicalTopic::factory()->create(['title' => 'Pipelining']);

    $q1 = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => null,
    ]);
    QuestionTopicLink::query()->create([
        'question_id' => $q1->id,
        'canonical_topic_id' => $topicA->id,
        'is_primary' => true,
    ]);

    $q2 = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => null,
    ]);
    QuestionTopicLink::query()->create([
        'question_id' => $q2->id,
        'canonical_topic_id' => $topicB->id,
        'is_primary' => true,
    ]);

    $q3 = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => null,
    ]);
    // q3 has no topic links — goes to "untagged" bucket

    $this->actingAs($this->admin)
        ->get(route('admin.question-library.course', ['course' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/question-library/courses/show')
            ->where('pool.id', $this->course->id)
            ->where('pool.questions_total', 3)
            ->has('pool.topics', 3)
        );
});

test('showCourse excludes paper-bound questions', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'question_paper_id' => null,
    ]);
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    Question::factory()->create([
        'institution_course_id' => null,
        'question_paper_id' => $paper->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.question-library.course', ['course' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('pool.questions_total', 1));
});

test('students cannot access pool builder', function () {
    $student = User::factory()->create();

    $this->actingAs($student)
        ->get(route('admin.question-library.course', ['course' => $this->course->id]))
        ->assertForbidden();
});

test('bulkAssign assigns unattached questions to a course', function () {
    $targetCourse = InstitutionCourse::factory()->for($this->institution)->create();
    $questions = Question::factory()->count(3)->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.question-library.unattached.bulk-assign'), [
            'question_ids' => $questions->pluck('id')->all(),
            'action' => 'assign_course',
            'target_id' => $targetCourse->id,
        ])
        ->assertRedirect();

    foreach ($questions as $q) {
        $this->assertDatabaseHas('questions', [
            'id' => $q->id,
            'institution_course_id' => $targetCourse->id,
            'question_paper_id' => null,
        ]);
    }
});

test('bulkAssign attaches unattached questions to a paper', function () {
    $paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $questions = Question::factory()->count(2)->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.question-library.unattached.bulk-assign'), [
            'question_ids' => $questions->pluck('id')->all(),
            'action' => 'attach_paper',
            'target_id' => $paper->id,
        ])
        ->assertRedirect();

    foreach ($questions as $q) {
        $this->assertDatabaseHas('questions', [
            'id' => $q->id,
            'question_paper_id' => $paper->id,
            'institution_course_id' => null,
            'exam_subject_id' => null,
        ]);
    }
});

test('bulkAssign delete removes only selected unattached questions', function () {
    $toDelete = Question::factory()->count(2)->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);
    $keep = Question::factory()->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.question-library.unattached.bulk-assign'), [
            'question_ids' => $toDelete->pluck('id')->all(),
            'action' => 'delete',
        ])
        ->assertRedirect();

    foreach ($toDelete as $q) {
        $this->assertDatabaseMissing('questions', ['id' => $q->id]);
    }
    $this->assertDatabaseHas('questions', ['id' => $keep->id]);
});

test('bulkAssign does not touch questions that are no longer unattached', function () {
    $targetCourse = InstitutionCourse::factory()->for($this->institution)->create();
    $existingPaper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
    $alreadyAttached = Question::factory()->create([
        'question_paper_id' => $existingPaper->id,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.question-library.unattached.bulk-assign'), [
            'question_ids' => [$alreadyAttached->id],
            'action' => 'assign_course',
            'target_id' => $targetCourse->id,
        ])
        ->assertRedirect();

    // Untouched — still bound to its existing paper, not the target course
    $this->assertDatabaseHas('questions', [
        'id' => $alreadyAttached->id,
        'question_paper_id' => $existingPaper->id,
        'institution_course_id' => null,
    ]);
});

test('bulkAssign rejects target_id missing when action requires one', function () {
    $question = Question::factory()->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.question-library.unattached.bulk-assign'), [
            'question_ids' => [$question->id],
            'action' => 'assign_course',
        ])
        ->assertSessionHasErrors('target_id');
});

test('students cannot bulkAssign', function () {
    $student = User::factory()->create();
    $question = Question::factory()->create([
        'question_paper_id' => null,
        'institution_course_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($student)
        ->post(route('admin.question-library.unattached.bulk-assign'), [
            'question_ids' => [$question->id],
            'action' => 'delete',
        ])
        ->assertForbidden();
});
