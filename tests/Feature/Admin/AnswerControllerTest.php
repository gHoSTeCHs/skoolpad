<?php

use App\Enums\AnswerDepthLevel;
use App\Models\InstitutionCourse;
use App\Models\Question;
use App\Models\QuestionAnswer;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->course = InstitutionCourse::factory()->create();
    $this->question = Question::factory()->for($this->course)->create(['created_by' => $this->admin->id]);
});

test('legacy answers URL redirects course-scoped questions to the course builder', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.questions.answers', $this->question))
        ->assertRedirect(route('admin.question-library.course', $this->course));
});

test('store creates answer with content', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.questions.answers.store', $this->question), [
            'depth_level' => 'quick',
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Short answer.']]]]],
            'content_plain' => 'Short answer.',
            'is_published' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Answer saved.');

    $answer = QuestionAnswer::first();
    expect($answer)->not->toBeNull();
    expect($answer->question_id)->toBe($this->question->id);
    expect($answer->depth_level)->toBe(AnswerDepthLevel::Quick);
    expect($answer->created_by)->toBe($this->admin->id);
});

test('store rejects duplicate depth_level for same question', function () {
    QuestionAnswer::factory()->for($this->question)->quick()->create(['created_by' => $this->admin->id]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.answers.store', $this->question), [
            'depth_level' => 'quick',
            'content' => ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Duplicate.']]]]],
            'content_plain' => 'Duplicate.',
            'is_published' => false,
        ])
        ->assertSessionHasErrors(['depth_level']);
});

test('update modifies answer content', function () {
    $answer = QuestionAnswer::factory()->for($this->question)->quick()->create(['created_by' => $this->admin->id]);

    $newContent = ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Updated answer.']]]]];

    $this->actingAs($this->admin)
        ->put(route('admin.questions.answers.update', [$this->question, $answer]), [
            'depth_level' => 'quick',
            'content' => $newContent,
            'content_plain' => 'Updated answer.',
            'is_published' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Answer updated.');

    $answer->refresh();
    expect($answer->content_plain)->toBe('Updated answer.');
});

test('guests cannot access answer routes', function () {
    $this->get(route('admin.questions.answers', $this->question))->assertRedirect(route('login'));
    $this->post(route('admin.questions.answers.store', $this->question))->assertRedirect(route('login'));
});
