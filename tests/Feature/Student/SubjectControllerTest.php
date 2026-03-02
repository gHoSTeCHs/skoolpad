<?php

use App\Models\BlockCompletion;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CurriculumSubject;
use App\Models\EducationLevel;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\StudentProfile;
use App\Models\TopicCompletion;
use App\Models\User;

beforeEach(function () {
    $this->student = User::factory()->create();
    $this->profile = StudentProfile::factory()->secondary()->create([
        'user_id' => $this->student->id,
    ]);

    $this->curriculumSubject = CurriculumSubject::factory()->create();
    $this->levelSubject = LevelSubject::factory()->create([
        'education_level_id' => $this->profile->education_level_id,
        'curriculum_subject_id' => $this->curriculumSubject->id,
        'stream_id' => null,
    ]);

    $this->actingAs($this->student);
});

test('show renders subject with scheme items grouped by term', function () {
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 1,
        'week_number' => 1,
        'topic_label' => 'Introduction to Numbers',
    ]);
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 1,
        'week_number' => 2,
        'topic_label' => 'Addition and Subtraction',
    ]);
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 2,
        'week_number' => 1,
        'topic_label' => 'Multiplication',
    ]);

    $this->get(route('subjects.show', $this->levelSubject))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('subjects/show')
            ->where('subject.name', $this->curriculumSubject->name)
            ->where('subject.is_compulsory', true)
            ->has('terms', 2)
            ->where('terms.0.term', 1)
            ->has('terms.0.weeks', 2)
            ->where('terms.0.weeks.0.week', 1)
            ->has('terms.0.weeks.0.items', 1)
            ->where('terms.0.weeks.0.items.0.topic_label', 'Introduction to Numbers')
            ->where('terms.1.term', 2)
            ->has('terms.1.weeks', 1)
            ->where('progress.total', 3)
            ->where('progress.completed', 0)
        );
});

test('show includes completion status for items with topics', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 1,
        'week_number' => 1,
        'topic_label' => 'Test Topic',
        'canonical_topic_id' => $topic->id,
    ]);

    TopicCompletion::factory()->create([
        'user_id' => $this->student->id,
        'canonical_topic_id' => $topic->id,
    ]);

    $this->get(route('subjects.show', $this->levelSubject))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('terms.0.weeks.0.items.0.is_completed', true)
            ->where('terms.0.weeks.0.items.0.topic_title', $topic->title)
            ->where('progress.completed', 1)
        );
});

test('show includes completion status for items with blocks', function () {
    $topic = CanonicalTopic::factory()->create(['is_published' => true]);
    $block = ContentBlock::factory()->published()->create([
        'canonical_topic_id' => $topic->id,
        'is_container' => false,
        'path' => '1',
    ]);

    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $this->levelSubject->id,
        'term' => 1,
        'week_number' => 1,
        'topic_label' => 'Test Block',
        'content_block_id' => $block->id,
    ]);

    BlockCompletion::factory()->create([
        'user_id' => $this->student->id,
        'content_block_id' => $block->id,
    ]);

    $this->get(route('subjects.show', $this->levelSubject))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('terms.0.weeks.0.items.0.is_completed', true)
            ->where('terms.0.weeks.0.items.0.block_title', $block->title)
            ->where('progress.completed', 1)
        );
});

test('show returns 403 for mismatched education level', function () {
    $otherLevel = EducationLevel::factory()->create();
    $otherSubject = LevelSubject::factory()->create([
        'education_level_id' => $otherLevel->id,
        'curriculum_subject_id' => $this->curriculumSubject->id,
    ]);

    $this->get(route('subjects.show', $otherSubject))
        ->assertForbidden();
});

test('guests cannot access subjects', function () {
    auth()->logout();

    $this->get(route('subjects.show', $this->levelSubject))
        ->assertRedirect(route('login'));
});
