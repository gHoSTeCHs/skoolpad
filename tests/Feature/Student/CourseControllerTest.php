<?php

use App\Enums\QuestionStatus;
use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseTopicMapping;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\QuestionBlockLink;
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
        'level' => '200L',
    ]);

    $this->course = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
        'owning_department_id' => $this->department->id,
    ]);

    StudentCourse::factory()->create([
        'student_profile_id' => $this->profile->id,
        'institution_course_id' => $this->course->id,
    ]);

    $this->actingAs($this->student);
});

test('index shows enrolled courses with counts', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic->id,
        'sequence_order' => 1,
    ]);

    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('courses/index')
            ->has('courses', 1)
            ->where('courses.0.course_code', $this->course->course_code)
            ->where('courses.0.topics_count', 1)
            ->where('courses.0.questions_count', 1)
            ->where('courses.0.completed_topics_count', 0)
        );
});

test('index only shows enrolled courses', function () {
    $otherCourse = InstitutionCourse::factory()->create([
        'institution_id' => $this->institution->id,
    ]);

    $this->get(route('courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('courses', 1)
            ->where('courses.0.id', $this->course->id)
        );
});

test('index excludes archived enrollments', function () {
    StudentCourse::query()->update(['is_archived' => true]);

    $this->get(route('courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('courses', 0)
        );
});

test('show renders topics tab by default with ordered topics', function () {
    $topic1 = CanonicalTopic::factory()->create(['is_published' => true, 'title' => 'Introduction']);
    $topic2 = CanonicalTopic::factory()->create(['is_published' => true, 'title' => 'Data Structures']);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic2->id,
        'sequence_order' => 2,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic1->id,
        'sequence_order' => 1,
    ]);

    $this->get(route('courses.show', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('courses/show')
            ->where('activeTab', 'topics')
            ->has('topics', 2)
            ->where('topics.0.sequence_order', 1)
            ->where('topics.0.title', 'Introduction')
            ->where('topics.1.sequence_order', 2)
            ->where('topics.1.title', 'Data Structures')
            ->has('topicsProgress')
            ->where('topicsProgress.total', 2)
            ->where('topicsProgress.completed', 0)
        );
});

test('show topics tab shows completion status', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic->id,
        'sequence_order' => 1,
    ]);

    TopicCompletion::factory()->create([
        'user_id' => $this->student->id,
        'canonical_topic_id' => $topic->id,
    ]);

    $this->get(route('courses.show', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topics.0.is_completed', true)
            ->where('topicsProgress.completed', 1)
        );
});

test('show topics tab includes question count per topic', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic->id,
        'sequence_order' => 1,
    ]);

    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    QuestionTopicLink::factory()->create([
        'question_id' => $question->id,
        'canonical_topic_id' => $topic->id,
    ]);

    $this->get(route('courses.show', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topics.0.question_count', 1)
        );
});

test('show past questions tab returns published questions with filters', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2023,
    ]);

    QuestionAnswer::factory()->create([
        'question_id' => $question->id,
        'is_published' => true,
    ]);

    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Draft,
    ]);

    $this->get(route('courses.show', [$this->course, 'tab' => 'past_questions']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeTab', 'past_questions')
            ->has('questions.data', 1)
            ->has('filterOptions')
        );
});

test('show past questions tab includes question_block_links for each question', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    $block = ContentBlock::factory()->create([
        'canonical_topic_id' => $topic->id,
        'is_published' => true,
    ]);
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);
    QuestionBlockLink::create([
        'question_id' => $question->id,
        'content_block_id' => $block->id,
        'relevance' => 'primary',
    ]);

    $this->get(route('courses.show', [$this->course, 'tab' => 'past_questions']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data.0.question_block_links', 1)
            ->where('questions.data.0.question_block_links.0.content_block_id', $block->id)
            ->where('questions.data.0.question_block_links.0.relevance', 'primary')
        );
});

test('show past questions tab filters by year', function () {
    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2023,
    ]);

    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2022,
    ]);

    $this->get(route('courses.show', [$this->course, 'tab' => 'past_questions', 'year' => 2023]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
        );
});

test('show past questions tab paginates', function () {
    Question::factory()->count(20)->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('courses.show', [$this->course, 'tab' => 'past_questions']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 15)
            ->where('questions.meta.total', 20)
        );
});

test('show past questions tab returns hierarchical questions with children nested', function () {
    $parent = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
        'year' => 2023,
    ]);

    $child1 = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'parent_question_id' => $parent->id,
        'status' => QuestionStatus::Published,
        'sort_order' => 1,
    ]);

    $child2 = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'parent_question_id' => $parent->id,
        'status' => QuestionStatus::Published,
        'sort_order' => 2,
    ]);

    QuestionAnswer::factory()->create([
        'question_id' => $child1->id,
        'is_published' => true,
    ]);

    $this->get(route('courses.show', [$this->course, 'tab' => 'past_questions']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 1)
            ->where('questions.data.0.id', $parent->id)
            ->has('questions.data.0.children', 2)
            ->where('questions.data.0.children.0.id', $child1->id)
            ->where('questions.data.0.children.1.id', $child2->id)
        );
});

test('show past questions tab excludes child questions from top-level results', function () {
    $parent = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'parent_question_id' => $parent->id,
        'status' => QuestionStatus::Published,
    ]);

    $standalone = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'status' => QuestionStatus::Published,
    ]);

    $this->get(route('courses.show', [$this->course, 'tab' => 'past_questions']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('questions.data', 2)
        );
});

test('show returns 403 for non-enrolled course', function () {
    $otherCourse = InstitutionCourse::factory()->create();

    $this->get(route('courses.show', $otherCourse))
        ->assertForbidden();
});

test('guests cannot access courses', function () {
    auth()->logout();

    $this->get(route('courses.index'))->assertRedirect(route('login'));
    $this->get(route('courses.show', $this->course))->assertRedirect(route('login'));
});

test('unboarded students cannot access courses', function () {
    $newStudent = User::factory()->create();

    $this->actingAs($newStudent)
        ->get(route('courses.index'))
        ->assertRedirect(route('onboarding.index'));
});

test('show topics tab includes block counts per topic', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic->id,
        'sequence_order' => 1,
    ]);

    $block1 = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic->id,
        'is_container' => false,
        'path' => '1',
        'sort_order' => 1,
    ]);
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic->id,
        'is_container' => false,
        'path' => '2',
        'sort_order' => 2,
    ]);
    ContentBlock::factory()->published()->container()->create([
        'canonical_topic_id' => $topic->id,
        'path' => '3',
        'sort_order' => 3,
    ]);
    ContentBlock::factory()->create([
        'canonical_topic_id' => $topic->id,
        'is_container' => false,
        'is_published' => false,
        'path' => '4',
        'sort_order' => 4,
    ]);

    BlockCompletion::factory()->create([
        'user_id' => $this->student->id,
        'content_block_id' => $block1->id,
    ]);

    $this->get(route('courses.show', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topics.0.total_blocks', 2)
            ->where('topics.0.completed_blocks', 1)
        );
});

test('show topics tab block progress sums across all topics', function () {
    $topic1 = CanonicalTopic::factory()->create(['is_published' => true]);
    $topic2 = CanonicalTopic::factory()->create(['is_published' => true]);

    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic1->id,
        'sequence_order' => 1,
    ]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic2->id,
        'sequence_order' => 2,
    ]);

    $block = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic1->id,
        'is_container' => false,
        'path' => '1',
        'sort_order' => 1,
    ]);
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic1->id,
        'is_container' => false,
        'path' => '2',
        'sort_order' => 2,
    ]);
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic1->id,
        'is_container' => false,
        'path' => '3',
        'sort_order' => 3,
    ]);
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic2->id,
        'is_container' => false,
        'path' => '1',
        'sort_order' => 1,
    ]);
    ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic2->id,
        'is_container' => false,
        'path' => '2',
        'sort_order' => 2,
    ]);

    BlockCompletion::factory()->create([
        'user_id' => $this->student->id,
        'content_block_id' => $block->id,
    ]);

    $this->get(route('courses.show', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topicsProgress.total_blocks', 5)
            ->where('topicsProgress.completed_blocks', 1)
        );
});

test('show topics tab returns zero block counts when no blocks exist', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    CourseTopicMapping::factory()->create([
        'institution_course_id' => $this->course->id,
        'canonical_topic_id' => $topic->id,
        'sequence_order' => 1,
    ]);

    $this->get(route('courses.show', $this->course))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topics.0.total_blocks', 0)
            ->where('topics.0.completed_blocks', 0)
            ->where('topicsProgress.total_blocks', 0)
            ->where('topicsProgress.completed_blocks', 0)
        );
});
