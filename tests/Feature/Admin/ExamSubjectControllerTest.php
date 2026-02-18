<?php

use App\Models\ExamSubject;
use App\Models\ExamType;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->examType = ExamType::factory()->create();
});

test('index displays exam subjects page scoped to exam type', function () {
    ExamSubject::factory()->for($this->examType)->count(3)->create();
    ExamSubject::factory()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.index', $this->examType))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-subjects/index')
            ->has('examSubjects.data', 3)
            ->has('examSubjects.meta.current_page')
            ->has('examSubjects.meta.last_page')
            ->has('examSubjects.meta.per_page')
            ->has('examSubjects.meta.total')
            ->has('examSubjects.links.prev')
            ->has('examSubjects.links.next')
            ->has('examType')
        );
});

test('index filters exam subjects by search', function () {
    ExamSubject::factory()->for($this->examType)->create(['name' => 'Mathematics']);
    ExamSubject::factory()->for($this->examType)->create(['name' => 'English Language']);

    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.index', [$this->examType, 'search' => 'Mathematics']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('examSubjects.data', 1)
        );
});

test('create displays create exam subject page', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.create', $this->examType))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-subjects/create')
            ->has('examType')
        );
});

test('store creates an exam subject and redirects', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.exam-subjects.store', $this->examType), [
            'name' => 'Physics',
            'slug' => 'physics',
            'is_compulsory' => false,
        ])
        ->assertRedirect(route('admin.exam-subjects.index', $this->examType));

    $this->assertDatabaseHas('exam_subjects', [
        'exam_type_id' => $this->examType->id,
        'name' => 'Physics',
        'slug' => 'physics',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.exam-subjects.store', $this->examType), [])
        ->assertSessionHasErrors(['name', 'slug']);
});

test('store validates unique slug per exam type', function () {
    ExamSubject::factory()->for($this->examType)->create(['slug' => 'physics']);

    $this->actingAs($this->admin)
        ->post(route('admin.exam-subjects.store', $this->examType), [
            'name' => 'Physics',
            'slug' => 'physics',
        ])
        ->assertSessionHasErrors(['slug']);
});

test('edit displays edit exam subject page', function () {
    $examSubject = ExamSubject::factory()->for($this->examType)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.exam-subjects.edit', $examSubject))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/exam-subjects/edit')
            ->has('examSubject')
        );
});

test('update modifies an exam subject and redirects', function () {
    $examSubject = ExamSubject::factory()->for($this->examType)->create();

    $this->actingAs($this->admin)
        ->put(route('admin.exam-subjects.update', $examSubject), [
            'name' => 'Updated Subject',
            'slug' => 'updated-subject',
            'is_compulsory' => true,
        ])
        ->assertRedirect(route('admin.exam-subjects.index', $this->examType));

    $this->assertDatabaseHas('exam_subjects', [
        'id' => $examSubject->id,
        'name' => 'Updated Subject',
        'slug' => 'updated-subject',
    ]);
});

test('update allows keeping the same slug for the same exam subject', function () {
    $examSubject = ExamSubject::factory()->for($this->examType)->create(['slug' => 'physics']);

    $this->actingAs($this->admin)
        ->put(route('admin.exam-subjects.update', $examSubject), [
            'name' => $examSubject->name,
            'slug' => 'physics',
        ])
        ->assertRedirect(route('admin.exam-subjects.index', $this->examType));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.exam-subjects.index', $this->examType))
        ->assertForbidden();
});

test('guests cannot access exam subject routes', function () {
    $examType = ExamType::factory()->create();
    $this->get(route('admin.exam-subjects.index', $examType))->assertRedirect(route('login'));
    $this->get(route('admin.exam-subjects.create', $examType))->assertRedirect(route('login'));
});
