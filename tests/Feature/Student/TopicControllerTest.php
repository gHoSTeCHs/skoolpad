<?php

use App\Enums\QuestionStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionTopicLink;
use App\Models\StudentCourse;
use App\Models\StudentProfile;
use App\Models\TopicCompletion;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->institution = Institution::factory()->create();
    $this->faculty = Faculty::factory()->for($this->institution)->create();
    $this->department = Department::factory()->for($this->faculty)->create();

    $this->profile = StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'institution_id' => $this->institution->id,
        'faculty_id' => $this->faculty->id,
        'department_id' => $this->department->id,
    ]);

    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);

    $this->topic = CanonicalTopic::factory()->create(['is_published' => true]);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $this->topic->id,
        'sequence_order' => 1,
    ]);

    $this->actingAs($this->student);
});

test('student can view topic content page', function () {
    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('topics/show')
            ->has('topic')
            ->where('topic.title', $this->topic->title)
            ->has('prerequisiteStatus')
            ->has('relatedQuestions')
        );
});

test('course context provides prev and next navigation', function () {
    $topic2 = CanonicalTopic::factory()->create(['is_published' => true]);
    $topic3 = CanonicalTopic::factory()->create(['is_published' => true]);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic2->id,
        'sequence_order' => 2,
    ]);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic3->id,
        'sequence_order' => 3,
    ]);

    $this->get(route('topics.show', [$topic2, 'course' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('courseContext')
            ->where('courseContext.id', $this->course->id)
            ->has('prevTopic')
            ->where('prevTopic.id', $this->topic->id)
            ->has('nextTopic')
            ->where('nextTopic.id', $topic3->id)
        );
});

test('first topic has no prev and last has no next', function () {
    $topic2 = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic2->id,
        'sequence_order' => 2,
    ]);

    $this->get(route('topics.show', [$this->topic, 'course' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('prevTopic', null)
            ->has('nextTopic')
        );

    $this->get(route('topics.show', [$topic2, 'course' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('prevTopic')
            ->where('nextTopic', null)
        );
});

test('related questions shown for course context', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    QuestionTopicLink::factory()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $this->topic->id,
    ]);

    $this->get(route('topics.show', [$this->topic, 'course' => $this->course->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('relatedQuestions', 1)
        );
});

test('cross institution question count is correct', function () {
    $otherCourse = InstitutionCourse::factory()->create();

    $q1 = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);
    $q2 = Question::factory()->create([
        'institution_course_id' => $otherCourse->id,
        'status' => QuestionStatus::Published,
    ]);

    QuestionTopicLink::factory()->create(['question_id' => $q1->id, 'canonical_topic_id' => $this->topic->id]);
    QuestionTopicLink::factory()->create(['question_id' => $q2->id, 'canonical_topic_id' => $this->topic->id]);

    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('crossInstitutionCount', 2)
        );
});

test('prerequisite banner shown when prerequisites exist', function () {
    $prereq = CanonicalTopic::factory()->create(['is_published' => true]);
    $this->topic->prerequisites()->attach($prereq->id, ['is_hard_prerequisite' => true]);

    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('prerequisiteStatus.banner', 'danger')
            ->has('prerequisiteStatus.prerequisites', 1)
        );
});

test('topic with content blocks shows block tree', function () {
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
        'sort_order' => 1,
    ]);

    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('hasBlocks', true)
            ->has('blockTree', 1)
        );
});

test('topic without blocks has hasBlocks false', function () {
    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('hasBlocks', false)
            ->where('blockTree', null)
        );
});

test('toggle complete creates topic completion', function () {
    $this->post(route('topics.complete', $this->topic))
        ->assertRedirect();

    $this->assertDatabaseHas('topic_completions', [
        'user_id' => $this->student->id,
        'canonical_topic_id' => $this->topic->id,
    ]);
});

test('toggle complete deletes existing completion', function () {
    TopicCompletion::factory()->create([
        'user_id' => $this->student->id,
        'canonical_topic_id' => $this->topic->id,
    ]);

    $this->post(route('topics.complete', $this->topic))
        ->assertRedirect();

    $this->assertDatabaseMissing('topic_completions', [
        'user_id' => $this->student->id,
        'canonical_topic_id' => $this->topic->id,
    ]);
});

test('toggle block complete creates and deletes block completion', function () {
    $block = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $this->topic->id,
    ]);

    $this->post(route('blocks.complete', $block))
        ->assertRedirect();

    $this->assertDatabaseHas('block_completions', [
        'user_id' => $this->student->id,
        'content_block_id' => $block->id,
    ]);

    $this->post(route('blocks.complete', $block))
        ->assertRedirect();

    $this->assertDatabaseMissing('block_completions', [
        'user_id' => $this->student->id,
        'content_block_id' => $block->id,
    ]);
});

test('topic show includes simplified_content when present', function () {
    $this->topic->update([
        'simplified_content' => [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Simple version']]],
            ],
        ],
    ]);

    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('topic.simplified_content')
            ->where('topic.simplified_content.type', 'doc')
        );
});

test('topic show has null simplified_content when absent', function () {
    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topic.simplified_content', null)
        );
});

test('block tree includes simplifiedContent per block', function () {
    ContentBlock::factory()->published()->withSimplifiedContent()->create([
        'canonical_topic_id' => $this->topic->id,
        'sort_order' => 1,
    ]);

    $this->get(route('topics.show', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('hasBlocks', true)
            ->has('blockTree', 1)
            ->has('blockTree.0.simplifiedContent')
        );
});

test('guests cannot access topics', function () {
    auth()->logout();

    $this->get(route('topics.show', $this->topic))
        ->assertRedirect(route('login'));
});
