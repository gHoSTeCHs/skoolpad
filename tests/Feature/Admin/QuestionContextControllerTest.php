<?php

use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionContext;
use App\Models\QuestionPaper;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->course = InstitutionCourse::factory()->create();
    $this->paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
});

test('store creates context within paper', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.contexts.store', $this->paper), [
            'context_type' => 'passage',
            'title' => 'Read the following passage',
            'content' => 'Lorem ipsum dolor sit amet...',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('question_contexts', [
        'question_paper_id' => $this->paper->id,
        'context_type' => 'passage',
        'title' => 'Read the following passage',
    ]);
});

test('store validates context_type', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.contexts.store', $this->paper), [
            'context_type' => 'invalid_type',
            'title' => 'Test',
        ])
        ->assertSessionHasErrors('context_type');
});

test('store creates table context with table_data', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.contexts.store', $this->paper), [
            'context_type' => 'table',
            'title' => 'GDP Data',
            'table_data' => [
                'headers' => ['Year', 'GDP'],
                'rows' => [['2020', '1.5T'], ['2021', '1.7T']],
            ],
        ])
        ->assertRedirect();

    $context = QuestionContext::where('question_paper_id', $this->paper->id)
        ->where('context_type', 'table')
        ->first();

    expect($context->table_data)->toBeArray()
        ->and($context->table_data['headers'])->toBe(['Year', 'GDP']);
});

test('store creates word_bank context', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.contexts.store', $this->paper), [
            'context_type' => 'word_bank',
            'title' => 'Biology Terms',
            'word_bank' => ['photosynthesis', 'chlorophyll', 'glucose'],
        ])
        ->assertRedirect();

    $context = QuestionContext::where('question_paper_id', $this->paper->id)
        ->where('context_type', 'word_bank')
        ->first();

    expect($context->word_bank)->toBe(['photosynthesis', 'chlorophyll', 'glucose']);
});

test('store creates code_snippet context with language', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.contexts.store', $this->paper), [
            'context_type' => 'code_snippet',
            'title' => 'Python Function',
            'content' => 'def hello(): return "world"',
            'language' => 'python',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('question_contexts', [
        'question_paper_id' => $this->paper->id,
        'context_type' => 'code_snippet',
        'language' => 'python',
    ]);
});

test('update modifies context', function () {
    $context = QuestionContext::factory()->create(['question_paper_id' => $this->paper->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.question-papers.contexts.update', [$this->paper, $context]), [
            'context_type' => 'passage',
            'title' => 'Updated Title',
            'content' => 'Updated content',
        ])
        ->assertRedirect();

    expect($context->fresh()->title)->toBe('Updated Title');
});

test('destroy deletes context', function () {
    $context = QuestionContext::factory()->create(['question_paper_id' => $this->paper->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.question-papers.contexts.destroy', [$this->paper, $context]))
        ->assertRedirect();

    $this->assertDatabaseMissing('question_contexts', ['id' => $context->id]);
});

test('link attaches context to question', function () {
    $context = QuestionContext::factory()->create(['question_paper_id' => $this->paper->id]);
    $question = Question::factory()->create([
        'question_paper_id' => $this->paper->id,
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.questions.contexts.link', $question), [
            'context_id' => $context->id,
            'sort_order' => 1,
            'label' => 'Source 1',
        ])
        ->assertOk();

    $this->assertDatabaseHas('question_context_links', [
        'question_id' => $question->id,
        'question_context_id' => $context->id,
        'sort_order' => 1,
        'label' => 'Source 1',
    ]);
});

test('link validates context_id exists', function () {
    $question = Question::factory()->create([
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.questions.contexts.link', $question), [
            'context_id' => 'nonexistent-uuid',
        ])
        ->assertUnprocessable();
});

test('unlink detaches context from question', function () {
    $context = QuestionContext::factory()->create(['question_paper_id' => $this->paper->id]);
    $question = Question::factory()->create([
        'question_paper_id' => $this->paper->id,
        'institution_course_id' => $this->course->id,
        'created_by' => $this->admin->id,
    ]);

    $question->contexts()->attach($context->id, ['sort_order' => 0]);

    $this->actingAs($this->admin)
        ->deleteJson(route('admin.questions.contexts.unlink', [$question, $context]))
        ->assertOk();

    $this->assertDatabaseMissing('question_context_links', [
        'question_id' => $question->id,
        'question_context_id' => $context->id,
    ]);
});
