<?php

use App\Models\InstitutionCourse;
use App\Models\QuestionPaper;
use App\Models\QuestionSection;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->course = InstitutionCourse::factory()->create();
    $this->paper = QuestionPaper::factory()->create(['institution_course_id' => $this->course->id]);
});

test('store creates section within paper', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.sections.store', $this->paper), [
            'label' => 'Section A',
            'instruction' => 'Answer ALL questions',
            'marks' => 40,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('question_sections', [
        'question_paper_id' => $this->paper->id,
        'label' => 'Section A',
        'marks' => 40,
        'sort_order' => 1,
    ]);
});

test('store auto-increments sort_order', function () {
    QuestionSection::factory()->create(['question_paper_id' => $this->paper->id, 'sort_order' => 1]);

    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.sections.store', $this->paper), [
            'label' => 'Section B',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('question_sections', [
        'question_paper_id' => $this->paper->id,
        'label' => 'Section B',
        'sort_order' => 2,
    ]);
});

test('store validates required label', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.question-papers.sections.store', $this->paper), ['label' => ''])
        ->assertSessionHasErrors('label');
});

test('update modifies section', function () {
    $section = QuestionSection::factory()->create(['question_paper_id' => $this->paper->id]);

    $this->actingAs($this->admin)
        ->put(route('admin.question-papers.sections.update', [$this->paper, $section]), [
            'label' => 'Updated Section',
            'instruction' => 'Choose any 3',
            'marks' => 60,
            'required_count' => 3,
        ])
        ->assertRedirect();

    $section->refresh();
    expect($section->label)->toBe('Updated Section')
        ->and($section->required_count)->toBe(3);
});

test('destroy deletes section', function () {
    $section = QuestionSection::factory()->create(['question_paper_id' => $this->paper->id]);

    $this->actingAs($this->admin)
        ->delete(route('admin.question-papers.sections.destroy', [$this->paper, $section]))
        ->assertRedirect();

    $this->assertDatabaseMissing('question_sections', ['id' => $section->id]);
});

test('reorder updates sort orders', function () {
    $section1 = QuestionSection::factory()->create(['question_paper_id' => $this->paper->id, 'sort_order' => 1]);
    $section2 = QuestionSection::factory()->create(['question_paper_id' => $this->paper->id, 'sort_order' => 2]);

    $this->actingAs($this->admin)
        ->postJson(route('admin.question-papers.sections.reorder', $this->paper), [
            'sections' => [
                ['id' => $section1->id, 'sort_order' => 2],
                ['id' => $section2->id, 'sort_order' => 1],
            ],
        ])
        ->assertOk();

    expect($section1->fresh()->sort_order)->toBe(2)
        ->and($section2->fresh()->sort_order)->toBe(1);
});

test('reorder validates section ids exist', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.question-papers.sections.reorder', $this->paper), [
            'sections' => [
                ['id' => 'nonexistent-uuid', 'sort_order' => 1],
            ],
        ])
        ->assertUnprocessable();
});
