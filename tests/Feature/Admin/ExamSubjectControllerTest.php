<?php

use App\Models\ExamSubject;
use App\Models\ExamType;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('index displays exam subjects page', function () {
    ExamSubject::factory()->count(3)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-subjects/index')
            ->has('examSubjects.data', 3)
            ->has('examTypes')
        );
});

test('index filters exam subjects by search', function () {
    ExamSubject::factory()->create(['name' => 'Mathematics']);
    ExamSubject::factory()->create(['name' => 'English Language']);

    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.index', ['search' => 'Mathematics']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('examSubjects.data', 1)
        );
});

test('index filters exam subjects by exam_type_id', function () {
    $examType = ExamType::factory()->create();
    ExamSubject::factory()->for($examType)->create();
    ExamSubject::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.index', ['exam_type_id' => $examType->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('examSubjects.data', 1)
        );
});

test('create displays create exam subject page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-subjects/create')
            ->has('examTypes')
        );
});

test('store creates an exam subject and redirects', function () {
    $examType = ExamType::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.exam-subjects.store'), [
            'exam_type_id' => $examType->id,
            'name' => 'Physics',
            'slug' => 'physics',
            'is_compulsory' => false,
        ])
        ->assertRedirect(route('admin.exam-subjects.index'));

    $this->assertDatabaseHas('exam_subjects', [
        'exam_type_id' => $examType->id,
        'name' => 'Physics',
        'slug' => 'physics',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.exam-subjects.store'), [])
        ->assertSessionHasErrors(['exam_type_id', 'name', 'slug']);
});

test('store validates unique slug per exam type', function () {
    $examType = ExamType::factory()->create();
    ExamSubject::factory()->for($examType)->create(['slug' => 'physics']);

    $this->actingAs($this->admin)
        ->post(route('admin.exam-subjects.store'), [
            'exam_type_id' => $examType->id,
            'name' => 'Physics',
            'slug' => 'physics',
        ])
        ->assertSessionHasErrors(['slug']);
});

test('edit displays edit exam subject page', function () {
    $examSubject = ExamSubject::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.edit', $examSubject))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-subjects/edit')
            ->has('examSubject')
            ->has('examTypes')
        );
});

test('update modifies an exam subject and redirects', function () {
    $examSubject = ExamSubject::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.exam-subjects.update', $examSubject), [
            'exam_type_id' => $examSubject->exam_type_id,
            'name' => 'Updated Subject',
            'slug' => 'updated-subject',
            'is_compulsory' => true,
        ])
        ->assertRedirect(route('admin.exam-subjects.index'));

    $this->assertDatabaseHas('exam_subjects', [
        'id' => $examSubject->id,
        'name' => 'Updated Subject',
        'slug' => 'updated-subject',
    ]);
});

test('update allows keeping the same slug for the same exam subject', function () {
    $examSubject = ExamSubject::factory()->create(['slug' => 'physics']);

    $this->actingAs($this->admin)
        ->put(route('admin.exam-subjects.update', $examSubject), [
            'exam_type_id' => $examSubject->exam_type_id,
            'name' => $examSubject->name,
            'slug' => 'physics',
        ])
        ->assertRedirect(route('admin.exam-subjects.index'));
});

test('guests cannot access exam subject routes', function () {
    $this->get(route('admin.exam-subjects.index'))->assertRedirect(route('login'));
    $this->get(route('admin.exam-subjects.create'))->assertRedirect(route('login'));
});
