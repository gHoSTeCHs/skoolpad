<?php

use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Models\CanonicalTopic;
use App\Models\Discipline;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->institution = Institution::factory()->create(['is_active' => true]);
    $this->course = InstitutionCourse::factory()->for($this->institution)->create();
    $this->discipline = Discipline::factory()->create();
    $this->topic = CanonicalTopic::factory()->for($this->discipline)->create(['is_published' => true]);
});

function validQuestionData(array $overrides = []): array
{
    return array_merge([
        'institution_course_id' => test()->course->id,
        'question_type' => 'mcq',
        'content' => 'What is the time complexity of binary search?',
        'year' => 2024,
        'semester' => 'first',
        'marks' => 5,
        'difficulty_level' => 'medium',
        'source' => 'manual',
        'status' => 'draft',
        'response_config' => [
            'options' => [
                ['label' => 'A', 'text' => 'O(1)', 'is_correct' => false],
                ['label' => 'B', 'text' => 'O(log n)', 'is_correct' => true],
                ['label' => 'C', 'text' => 'O(n)', 'is_correct' => false],
            ],
        ],
        'topic_ids' => [test()->topic->id],
        'primary_topic_id' => test()->topic->id,
    ], $overrides);
}

test('index displays questions page with pagination structure', function () {
    Question::factory()->count(3)->for($this->course)->create(['created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.questions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/questions/index')
            ->has('questions.data', 3)
            ->has('questions.meta.current_page')
            ->has('questions.meta.last_page')
            ->has('questions.meta.per_page')
            ->has('questions.meta.total')
            ->has('questions.links.prev')
            ->has('questions.links.next')
            ->has('institutions')
            ->has('enum_options')
        );
});

test('index filters by status', function () {
    Question::factory()->for($this->course)->create(['status' => QuestionStatus::Draft, 'created_by' => $this->admin->id]);
    Question::factory()->for($this->course)->create(['status' => QuestionStatus::Published, 'created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.questions.index', ['status' => 'draft']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('questions.data', 1));
});

test('index filters by institution_id', function () {
    $otherInstitution = Institution::factory()->create();
    $otherCourse = InstitutionCourse::factory()->for($otherInstitution)->create();

    Question::factory()->for($this->course)->create(['created_by' => $this->admin->id]);
    Question::factory()->for($otherCourse)->create(['created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.questions.index', ['institution_id' => $this->institution->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('questions.data', 1));
});

test('index filters by search using FTS', function () {
    Question::factory()->for($this->course)->create([
        'content' => 'Explain the concept of binary search trees',
        'created_by' => $this->admin->id,
    ]);
    Question::factory()->for($this->course)->create([
        'content' => 'What is photosynthesis in plants',
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.questions.index', ['search' => 'binary search']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('questions.data', 1));
});

test('create returns create page with institutions and enum_options', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.questions.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/questions/create')
            ->has('institutions')
            ->has('enum_options.question_types')
            ->has('enum_options.difficulties')
            ->has('enum_options.sources')
            ->has('enum_options.semesters')
        );
});

test('store creates question with response_config and topic links', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), validQuestionData())
        ->assertRedirect()
        ->assertSessionHas('success', 'Question created.');

    $question = Question::first();
    expect($question)->not->toBeNull()
        ->and($question->response_config)->toBeArray()
        ->and($question->response_config['options'])->toHaveCount(3)
        ->and($question->topicLinks)->toHaveCount(1)
        ->and($question->topicLinks->first()->is_primary)->toBeTrue()
        ->and($question->created_by)->toBe($this->admin->id);
});

test('store creates theory question without response_config', function () {
    $data = validQuestionData([
        'question_type' => 'theory',
        'response_config' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $data)
        ->assertRedirect()
        ->assertSessionHas('success', 'Question created.');

    $question = Question::first();
    expect($question->question_type)->toBe(QuestionType::Theory)
        ->and($question->response_config)->toBeNull();
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), [])
        ->assertSessionHasErrors([
            'institution_course_id', 'question_type', 'content',
            'source', 'status', 'topic_ids', 'primary_topic_id',
        ]);
});

test('store rejects published status on create', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), validQuestionData([
            'status' => 'published',
        ]))
        ->assertSessionHasErrors(['status']);
});

test('store rejects duplicate topic_ids', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), validQuestionData([
            'topic_ids' => [$this->topic->id, $this->topic->id],
        ]))
        ->assertSessionHasErrors(['topic_ids.0', 'topic_ids.1']);
});

test('store rejects primary_topic_id not in topic_ids', function () {
    $otherTopic = CanonicalTopic::factory()->for($this->discipline)->create(['is_published' => true]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), validQuestionData([
            'topic_ids' => [$this->topic->id],
            'primary_topic_id' => $otherTopic->id,
        ]))
        ->assertSessionHasErrors(['primary_topic_id']);
});

test('edit returns edit page with question response_config and topic_links', function () {
    $question = Question::factory()->for($this->course)->create(['created_by' => $this->admin->id]);
    $question->topicLinks()->create(['canonical_topic_id' => $this->topic->id, 'is_primary' => true]);

    $this->actingAs($this->admin)
        ->get(route('admin.questions.edit', $question))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/questions/edit')
            ->has('question')
            ->where('question.id', $question->id)
            ->has('question.response_config.options', 4)
            ->has('question.topic_links', 1)
            ->has('institutions')
            ->has('enum_options')
        );
});

test('update modifies question and redirects', function () {
    $question = Question::factory()->for($this->course)->draft()->create(['created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.questions.update', $question), validQuestionData([
            'content' => 'Updated question content',
            'status' => 'in_review',
        ]))
        ->assertRedirect(route('admin.questions.edit', $question))
        ->assertSessionHas('success', 'Question updated.');

    $question->refresh();
    expect($question->content)->toBe('Updated question content')
        ->and($question->status)->toBe(QuestionStatus::InReview);
});

test('update sets published_at and reviewed_by when publishing', function () {
    $question = Question::factory()->for($this->course)->draft()->create(['created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.questions.update', $question), validQuestionData([
            'status' => 'published',
        ]))
        ->assertRedirect();

    $question->refresh();
    expect($question->status)->toBe(QuestionStatus::Published)
        ->and($question->published_at)->not->toBeNull()
        ->and($question->reviewed_by)->toBe($this->admin->id);
});

test('update rejects publish without permission', function () {
    $reviewer = User::factory()->contentReviewer()->create();
    $question = Question::factory()->for($this->course)->draft()->create(['created_by' => $this->admin->id]);

    $this->actingAs($reviewer)
        ->put(route('admin.questions.update', $question), validQuestionData([
            'status' => 'published',
        ]))
        ->assertSessionHasErrors(['status']);
});

test('update changes response_config when type changes', function () {
    $question = Question::factory()->for($this->course)->draft()->create(['created_by' => $this->admin->id]);

    expect($question->response_config['options'])->toHaveCount(4);

    $this->actingAs($this->admin)
        ->put(route('admin.questions.update', $question), validQuestionData([
            'question_type' => 'theory',
            'status' => 'draft',
            'response_config' => null,
        ]))
        ->assertRedirect();

    $question->refresh();
    expect($question->response_config)->toBeNull();
});

test('guests cannot access question routes', function () {
    $this->get(route('admin.questions.index'))->assertRedirect(route('login'));
    $this->get(route('admin.questions.create'))->assertRedirect(route('login'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.questions.index'))
        ->assertForbidden();
});
