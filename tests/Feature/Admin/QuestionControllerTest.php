<?php

use App\Enums\QuestionStatus;
use App\Enums\QuestionType;
use App\Models\CanonicalTopic;
use App\Models\Discipline;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
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

test('questions index route redirects to the question library', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.questions.index'))
        ->assertRedirect('/admin/question-library');
});

test('questions create route redirects to the question library', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.questions.create'))
        ->assertRedirect('/admin/question-library');
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

test('store persists content_doc Tiptap JSON alongside plain content', function () {
    $doc = [
        'type' => 'doc',
        'content' => [[
            'type' => 'paragraph',
            'content' => [['type' => 'text', 'text' => 'Define the term ACID.']],
        ]],
    ];

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), validQuestionData([
            'question_type' => 'theory',
            'response_config' => null,
            'content' => 'Define the term ACID.',
            'content_doc' => $doc,
        ]))
        ->assertRedirect();

    $question = Question::first();
    expect($question->content)->toBe('Define the term ACID.')
        ->and($question->content_doc)->toEqual($doc);
});

test('store accepts question without content_doc and stores null', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), validQuestionData([
            'question_type' => 'theory',
            'response_config' => null,
        ]))
        ->assertRedirect();

    expect(Question::first()->content_doc)->toBeNull();
});

test('store from paper builder returns back with created_question_id flash', function () {
    $paper = QuestionPaper::factory()->for($this->course)->create();
    $section = QuestionSection::factory()->for($paper)->create();

    $this->actingAs($this->admin)
        ->from(route('admin.question-papers.build', $paper))
        ->post(route('admin.questions.store'), validQuestionData([
            'question_paper_id' => $paper->id,
            'question_section_id' => $section->id,
            'from_paper_builder' => true,
        ]))
        ->assertRedirect(route('admin.question-papers.build', $paper))
        ->assertSessionHas('created_question_id');
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
            'source', 'status',
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

test('questions edit route redirects to the builder for the question container', function () {
    $question = Question::factory()->for($this->course)->create(['created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->get(route('admin.questions.edit', $question))
        ->assertRedirect(route('admin.question-library.course', $this->course));
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
        ->assertForbidden();
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

test('store creates paper-scoped question without institution_course_id', function () {
    $paper = QuestionPaper::factory()->for($this->course)->create();
    $section = QuestionSection::factory()->for($paper)->create();

    $data = validQuestionData([
        'institution_course_id' => null,
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'topic_ids' => null,
        'primary_topic_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $data)
        ->assertRedirect()
        ->assertSessionHas('success', 'Question created.');

    $question = Question::first();
    expect($question->question_paper_id)->toBe($paper->id)
        ->and($question->question_section_id)->toBe($section->id)
        ->and($question->institution_course_id)->toBeNull()
        ->and($question->topicLinks)->toHaveCount(0);
});

test('store creates nested child question with depth_level', function () {
    $parent = Question::factory()->for($this->course)->create([
        'created_by' => $this->admin->id,
        'depth_level' => 0,
    ]);

    $data = validQuestionData([
        'parent_question_id' => $parent->id,
        'question_type' => 'short_answer',
        'response_config' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $data)
        ->assertRedirect()
        ->assertSessionHas('success', 'Question created.');

    $child = Question::where('parent_question_id', $parent->id)->first();
    expect($child)->not->toBeNull()
        ->and($child->depth_level)->toBe(1);
});

test('store auto-increments sort_order within section', function () {
    $paper = QuestionPaper::factory()->for($this->course)->create();
    $section = QuestionSection::factory()->for($paper)->create();

    $existing = Question::factory()->for($this->course)->create([
        'question_section_id' => $section->id,
        'sort_order' => 0,
        'created_by' => $this->admin->id,
    ]);

    $data = validQuestionData([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $data)
        ->assertRedirect();

    $newQuestion = Question::where('question_section_id', $section->id)
        ->where('id', '!=', $existing->id)
        ->first();
    expect($newQuestion->sort_order)->toBe(1);
});

test('reorder updates question sort orders', function () {
    $q1 = Question::factory()->for($this->course)->create(['sort_order' => 0, 'created_by' => $this->admin->id]);
    $q2 = Question::factory()->for($this->course)->create(['sort_order' => 1, 'created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.questions.reorder'), [
            'questions' => [
                ['id' => $q1->id, 'sort_order' => 1],
                ['id' => $q2->id, 'sort_order' => 0],
            ],
        ])
        ->assertOk()
        ->assertJson(['message' => 'Questions reordered.']);

    expect($q1->fresh()->sort_order)->toBe(1)
        ->and($q2->fresh()->sort_order)->toBe(0);
});

test('store without institution_course_id or paper requires institution_course_id', function () {
    $data = validQuestionData([
        'institution_course_id' => null,
        'question_paper_id' => null,
        'exam_subject_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $data)
        ->assertSessionHasErrors(['institution_course_id']);
});

test('store creates question with block links', function () {
    $block = \App\Models\ContentBlock::factory()->create(['canonical_topic_id' => $this->topic->id]);

    $data = validQuestionData([
        'block_links' => [
            ['content_block_id' => $block->id, 'relevance' => 'primary'],
        ],
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $data)
        ->assertRedirect();

    $question = Question::latest('id')->first();
    expect($question->questionBlockLinks)->toHaveCount(1);
    expect($question->questionBlockLinks->first()->content_block_id)->toBe($block->id);
    expect($question->questionBlockLinks->first()->relevance->value)->toBe('primary');
});

test('update syncs block links', function () {
    $question = Question::factory()->for($this->course)->create(['created_by' => $this->admin->id]);
    $block1 = \App\Models\ContentBlock::factory()->create(['canonical_topic_id' => $this->topic->id]);
    $block2 = \App\Models\ContentBlock::factory()->create(['canonical_topic_id' => $this->topic->id, 'path' => '2', 'sort_order' => 2]);

    $question->questionBlockLinks()->create(['content_block_id' => $block1->id, 'relevance' => 'primary']);

    $this->actingAs($this->admin)
        ->put(route('admin.questions.update', $question), validQuestionData([
            'block_links' => [
                ['content_block_id' => $block2->id, 'relevance' => 'secondary'],
            ],
        ]))
        ->assertRedirect();

    $question->refresh();
    expect($question->questionBlockLinks)->toHaveCount(1);
    expect($question->questionBlockLinks->first()->content_block_id)->toBe($block2->id);
    expect($question->questionBlockLinks->first()->relevance->value)->toBe('secondary');
});

test('update clears all topic links when topic_ids is empty array', function () {
    $question = Question::factory()->for($this->course)->create(['created_by' => $this->admin->id]);
    $question->topicLinks()->create(['canonical_topic_id' => $this->topic->id, 'is_primary' => true]);

    $this->actingAs($this->admin)
        ->put(route('admin.questions.update', $question), validQuestionData([
            'topic_ids' => [],
            'primary_topic_id' => null,
        ]))
        ->assertRedirect();

    expect($question->fresh()->topicLinks)->toHaveCount(0);
});

test('links tab put with only topic fields does not overwrite response_config', function () {
    $originalConfig = ['options' => [['label' => 'A', 'text' => 'O(log n)', 'is_correct' => true]]];
    $question = Question::factory()->for($this->course)->create([
        'created_by' => $this->admin->id,
        'response_config' => $originalConfig,
    ]);

    $this->actingAs($this->admin)
        ->put(route('admin.questions.update', $question), [
            'topic_ids' => [$this->topic->id],
            'primary_topic_id' => $this->topic->id,
        ])
        ->assertRedirect();

    $question->refresh();
    expect($question->topicLinks)->toHaveCount(1);
    expect($question->response_config['options'])->toHaveCount(1);
    expect($question->response_config['options'][0]['text'])->toBe('O(log n)');
    expect($question->response_config['options'][0]['is_correct'])->toBeTrue();
});

it('creates a paper question from the builder and flashes the new id', function () {
    $paper = QuestionPaper::factory()->create();
    $section = QuestionSection::factory()->for($paper)->create();

    $response = $this->actingAs($this->admin)->post(route('admin.questions.store'), [
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'question_type' => 'mcq',
        'content' => 'What is 2 + 2?',
        'status' => 'draft',
        'source' => 'manual',
        'response_config' => [
            'options' => [
                ['label' => 'A', 'text' => '4', 'is_correct' => true],
                ['label' => 'B', 'text' => '5', 'is_correct' => false],
            ],
        ],
        'from_paper_builder' => true,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('created_question_id');
    $this->assertDatabaseHas('questions', [
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'content' => 'What is 2 + 2?',
    ]);
});

it('creates a nested sub-question when parent_question_id is provided', function () {
    $paper = QuestionPaper::factory()->create();
    $section = QuestionSection::factory()->for($paper)->create();
    $parent = Question::factory()->create([
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'question_type' => 'group',
        'response_config' => null,
    ]);

    $this->actingAs($this->admin)->post(route('admin.questions.store'), [
        'question_paper_id' => $paper->id,
        'question_section_id' => $section->id,
        'parent_question_id' => $parent->id,
        'question_type' => 'theory',
        'content' => 'Explain the result.',
        'status' => 'draft',
        'source' => 'manual',
        'from_paper_builder' => true,
    ])->assertRedirect();

    $this->assertDatabaseHas('questions', [
        'parent_question_id' => $parent->id,
        'content' => 'Explain the result.',
    ]);
});
