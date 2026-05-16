<?php

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

function groupParentPayload(array $overrides = []): array
{
    return array_merge([
        'institution_course_id' => test()->course->id,
        'question_type' => 'group',
        'content' => 'Question 3. Answer ALL parts.',
        'year' => 2024,
        'semester' => 'first',
        'marks' => null,
        'difficulty_level' => 'medium',
        'source' => 'manual',
        'status' => 'draft',
        'response_config' => null,
        'topic_ids' => [test()->topic->id],
        'primary_topic_id' => test()->topic->id,
    ], $overrides);
}

test('store creates a Group question with three sub-questions in one POST', function () {
    $payload = groupParentPayload([
        'sub_questions' => [
            [
                'question_type' => 'short_answer',
                'content' => 'Define velocity.',
                'marks' => 2,
                'sort_order' => 0,
                'response_config' => null,
            ],
            [
                'question_type' => 'short_answer',
                'content' => 'A car travels 60 km in 1.5 hours. Calculate average velocity.',
                'marks' => 5,
                'sort_order' => 1,
                'response_config' => null,
            ],
            [
                'question_type' => 'theory',
                'content' => 'Explain the difference between distance and displacement with examples.',
                'marks' => 8,
                'sort_order' => 2,
                'response_config' => null,
            ],
        ],
        'choice_group' => null,
    ]);

    $response = $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $payload);

    $response->assertSessionHasNoErrors();

    $parent = Question::query()->where('content', 'Question 3. Answer ALL parts.')->first();
    expect($parent)->not->toBeNull();
    expect($parent->question_type->value)->toBe('group');
    expect($parent->depth_level)->toBe(0);
    expect($parent->children()->count())->toBe(3);

    $children = $parent->children()->orderBy('sort_order')->get();
    expect($children[0]->content)->toBe('Define velocity.');
    expect($children[0]->marks)->toBe(2);
    expect($children[0]->depth_level)->toBe(1);
    expect($children[2]->question_type->value)->toBe('theory');
});

test('store persists choice_group on the parent question', function () {
    $payload = groupParentPayload([
        'sub_questions' => [
            ['question_type' => 'short_answer', 'content' => 'Part a', 'marks' => 5, 'sort_order' => 0, 'response_config' => null],
            ['question_type' => 'short_answer', 'content' => 'Part b', 'marks' => 5, 'sort_order' => 1, 'response_config' => null],
            ['question_type' => 'short_answer', 'content' => 'Part c', 'marks' => 10, 'sort_order' => 2, 'response_config' => null],
        ],
        'choice_group' => [
            'required' => ['a'],
            'chooseN' => 1,
            'optional' => ['b', 'c'],
        ],
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $payload)
        ->assertSessionHasNoErrors();

    $parent = Question::query()->where('content', 'Question 3. Answer ALL parts.')->first();
    expect($parent->choice_group['required'])->toBe(['a']);
    expect($parent->choice_group['chooseN'])->toBe(1);
    expect($parent->choice_group['optional'])->toBe(['b', 'c']);
});

test('update diffs sub-questions: keeps existing by id, creates new, deletes missing', function () {
    $parent = Question::factory()->for($this->course)->create([
        'question_type' => 'group',
        'created_by' => $this->admin->id,
    ]);
    $existingA = Question::factory()->for($this->course)->create([
        'parent_question_id' => $parent->id,
        'depth_level' => 1,
        'sort_order' => 0,
        'content' => 'Part a (original)',
        'created_by' => $this->admin->id,
    ]);
    $existingB = Question::factory()->for($this->course)->create([
        'parent_question_id' => $parent->id,
        'depth_level' => 1,
        'sort_order' => 1,
        'content' => 'Part b (will be removed)',
        'created_by' => $this->admin->id,
    ]);

    $payload = [
        'institution_course_id' => $this->course->id,
        'question_type' => 'group',
        'content' => $parent->content,
        'source' => $parent->source->value,
        'status' => $parent->status->value,
        'response_config' => null,
        'sub_questions' => [
            [
                'id' => $existingA->id,
                'question_type' => 'short_answer',
                'content' => 'Part a (edited)',
                'marks' => 7,
                'sort_order' => 0,
                'response_config' => null,
            ],
            [
                'question_type' => 'short_answer',
                'content' => 'Part c (new)',
                'marks' => 4,
                'sort_order' => 1,
                'response_config' => null,
            ],
        ],
    ];

    $this->actingAs($this->admin)
        ->put(route('admin.questions.update', $parent), $payload)
        ->assertSessionHasNoErrors();

    expect($parent->fresh()->children()->count())->toBe(2);
    expect($existingA->fresh()->content)->toBe('Part a (edited)');
    expect(Question::query()->find($existingB->id))->toBeNull();
    expect(Question::query()->where('content', 'Part c (new)')->count())->toBe(1);
});

test('store rejects sub-question content that is empty', function () {
    $payload = groupParentPayload([
        'sub_questions' => [
            ['question_type' => 'short_answer', 'content' => '', 'marks' => 5, 'sort_order' => 0, 'response_config' => null],
        ],
        'choice_group' => null,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $payload)
        ->assertSessionHasErrors(['sub_questions.0.content']);
});

test('store rejects choice_group with non-string label entries', function () {
    $payload = groupParentPayload([
        'sub_questions' => [
            ['question_type' => 'short_answer', 'content' => 'a', 'marks' => 5, 'sort_order' => 0, 'response_config' => null],
        ],
        'choice_group' => [
            'required' => [123],
            'chooseN' => 1,
            'optional' => [],
        ],
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.questions.store'), $payload)
        ->assertSessionHasErrors(['choice_group.required.0']);
});

test('legacy edit URL redirects course-scoped questions to the course builder', function () {
    $parent = Question::factory()->for($this->course)->create([
        'question_type' => 'group',
        'choice_group' => ['required' => ['a'], 'chooseN' => 1, 'optional' => ['b']],
        'created_by' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.questions.edit', $parent))
        ->assertRedirect(route('admin.question-library.course', $this->course));
});
