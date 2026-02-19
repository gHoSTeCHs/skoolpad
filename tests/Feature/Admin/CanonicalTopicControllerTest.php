<?php

use App\Enums\TopicDifficulty;
use App\Models\CanonicalTopic;
use App\Models\Discipline;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->discipline = Discipline::factory()->create();
});

function validTopicData(array $overrides = [], ?string $disciplineId = null): array
{
    return array_merge([
        'title' => 'Test Topic',
        'slug' => 'test-topic',
        'discipline_id' => $disciplineId,
        'difficulty_level' => 'foundational',
        'content' => [['type' => 'paragraph', 'text' => 'Some content']],
        'content_plain' => 'Some content',
        'summary' => 'A brief summary',
        'estimated_read_minutes' => 10,
        'is_published' => false,
    ], $overrides);
}

test('index displays topics page with pagination', function () {
    CanonicalTopic::factory()->count(3)->for($this->discipline)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.topics.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/topics/index')
            ->has('topics.data', 3)
            ->has('topics.meta.current_page')
            ->has('topics.meta.last_page')
            ->has('topics.meta.per_page')
            ->has('topics.meta.total')
            ->has('topics.links.prev')
            ->has('topics.links.next')
            ->has('disciplines')
        );
});

test('index filters by discipline_id', function () {
    $other = Discipline::factory()->create();
    CanonicalTopic::factory()->count(2)->for($this->discipline)->create();
    CanonicalTopic::factory()->for($other)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.topics.index', ['discipline_id' => $this->discipline->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('topics.data', 2));
});

test('index filters by difficulty_level', function () {
    CanonicalTopic::factory()->for($this->discipline)->create(['difficulty_level' => TopicDifficulty::Foundational]);
    CanonicalTopic::factory()->for($this->discipline)->create(['difficulty_level' => TopicDifficulty::Advanced]);

    $this->actingAs($this->admin)
        ->get(route('admin.topics.index', ['difficulty_level' => 'foundational']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('topics.data', 1));
});

test('index filters by is_published', function () {
    CanonicalTopic::factory()->for($this->discipline)->create(['is_published' => true]);
    CanonicalTopic::factory()->for($this->discipline)->unpublished()->create();

    $this->actingAs($this->admin)
        ->get(route('admin.topics.index', ['is_published' => '1']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('topics.data', 1));
});

test('index filters by search', function () {
    CanonicalTopic::factory()->for($this->discipline)->create(['title' => 'Algorithms']);
    CanonicalTopic::factory()->for($this->discipline)->create(['title' => 'Biology Basics']);

    $this->actingAs($this->admin)
        ->get(route('admin.topics.index', ['search' => 'Algorithm']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('topics.data', 1));
});

test('index defaults to created_at desc sorting', function () {
    $older = CanonicalTopic::factory()->for($this->discipline)->create([
        'title' => 'Older Topic',
        'created_at' => now()->subDay(),
    ]);
    $newer = CanonicalTopic::factory()->for($this->discipline)->create([
        'title' => 'Newer Topic',
        'created_at' => now(),
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.topics.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('topics.data.0.id', $newer->id)
            ->where('topics.data.1.id', $older->id)
        );
});

test('create returns create page with disciplines and difficulty_levels', function () {
    $this->actingAs($this->admin)
        ->get(route('admin.topics.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/topics/create')
            ->has('disciplines')
            ->has('difficulty_levels', 3)
        );
});

test('store creates a topic and redirects to edit', function () {
    $data = validTopicData(disciplineId: $this->discipline->id);

    $this->actingAs($this->admin)
        ->post(route('admin.topics.store'), $data)
        ->assertRedirect()
        ->assertSessionHas('success', 'Topic created.');

    $this->assertDatabaseHas('canonical_topics', [
        'title' => 'Test Topic',
        'slug' => 'test-topic',
        'discipline_id' => $this->discipline->id,
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.topics.store'), [])
        ->assertSessionHasErrors(['title', 'slug', 'discipline_id', 'difficulty_level', 'content']);
});

test('store enforces slug uniqueness per discipline', function () {
    CanonicalTopic::factory()->for($this->discipline)->create(['slug' => 'existing-slug']);

    $this->actingAs($this->admin)
        ->post(route('admin.topics.store'), validTopicData([
            'slug' => 'existing-slug',
        ], $this->discipline->id))
        ->assertSessionHasErrors(['slug']);
});

test('store allows same slug in different discipline', function () {
    CanonicalTopic::factory()->for($this->discipline)->create(['slug' => 'shared-slug']);
    $otherDiscipline = Discipline::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.topics.store'), validTopicData([
            'slug' => 'shared-slug',
        ], $otherDiscipline->id))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(CanonicalTopic::where('slug', 'shared-slug')->count())->toBe(2);
});

test('store rejects parent from different discipline', function () {
    $otherDiscipline = Discipline::factory()->create();
    $parent = CanonicalTopic::factory()->for($otherDiscipline)->create();

    $this->actingAs($this->admin)
        ->post(route('admin.topics.store'), validTopicData([
            'parent_topic_id' => $parent->id,
        ], $this->discipline->id))
        ->assertSessionHasErrors(['parent_topic_id']);
});

test('store syncs prerequisites with pivot data', function () {
    $prereq = CanonicalTopic::factory()->for($this->discipline)->create();

    $this->actingAs($this->admin)
        ->post(route('admin.topics.store'), validTopicData([
            'prerequisites' => [
                ['id' => $prereq->id, 'is_hard_prerequisite' => true],
            ],
        ], $this->discipline->id))
        ->assertRedirect();

    $topic = CanonicalTopic::where('slug', 'test-topic')
        ->where('discipline_id', $this->discipline->id)
        ->first();

    expect($topic->prerequisites)->toHaveCount(1);
    expect($topic->prerequisites->first()->pivot->is_hard_prerequisite)->toBeTrue();
});

test('store sets published_at when is_published is true', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.topics.store'), validTopicData([
            'is_published' => true,
        ], $this->discipline->id))
        ->assertRedirect();

    $topic = CanonicalTopic::where('slug', 'test-topic')
        ->where('discipline_id', $this->discipline->id)
        ->first();

    expect($topic->is_published)->toBeTrue();
    expect($topic->published_at)->not->toBeNull();
});

test('edit returns edit page with topic data and prerequisites', function () {
    $topic = CanonicalTopic::factory()->for($this->discipline)->create();
    $prereq = CanonicalTopic::factory()->for($this->discipline)->create();
    $topic->prerequisites()->attach($prereq->id, ['is_hard_prerequisite' => true]);

    $this->actingAs($this->admin)
        ->get(route('admin.topics.edit', $topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/topics/edit')
            ->has('topic')
            ->where('topic.id', $topic->id)
            ->has('topic.prerequisites', 1)
            ->has('disciplines')
            ->has('difficulty_levels')
            ->has('available_topics')
        );
});

test('update modifies topic and redirects', function () {
    $topic = CanonicalTopic::factory()->for($this->discipline)->create();

    $this->actingAs($this->admin)
        ->put(route('admin.topics.update', $topic), validTopicData([
            'title' => 'Updated Title',
            'slug' => 'updated-title',
        ], $this->discipline->id))
        ->assertRedirect(route('admin.topics.edit', $topic))
        ->assertSessionHas('success', 'Topic updated.');

    $this->assertDatabaseHas('canonical_topics', [
        'id' => $topic->id,
        'title' => 'Updated Title',
        'slug' => 'updated-title',
    ]);
});

test('update allows keeping same slug (ignore self)', function () {
    $topic = CanonicalTopic::factory()->for($this->discipline)->create(['slug' => 'my-slug']);

    $this->actingAs($this->admin)
        ->put(route('admin.topics.update', $topic), validTopicData([
            'slug' => 'my-slug',
        ], $this->discipline->id))
        ->assertRedirect()
        ->assertSessionHas('success');
});

test('update rejects self-referencing prerequisite', function () {
    $topic = CanonicalTopic::factory()->for($this->discipline)->create();

    $this->actingAs($this->admin)
        ->put(route('admin.topics.update', $topic), validTopicData([
            'prerequisites' => [
                ['id' => $topic->id, 'is_hard_prerequisite' => false],
            ],
        ], $this->discipline->id))
        ->assertSessionHasErrors(['prerequisites']);
});

test('update sets published_at on first publish only', function () {
    $topic = CanonicalTopic::factory()->for($this->discipline)->unpublished()->create();

    $this->actingAs($this->admin)
        ->put(route('admin.topics.update', $topic), validTopicData([
            'is_published' => true,
        ], $this->discipline->id));

    $topic->refresh();
    expect($topic->is_published)->toBeTrue();
    expect($topic->published_at)->not->toBeNull();
    $firstPublishedAt = $topic->published_at->toDateTimeString();

    $this->actingAs($this->admin)
        ->put(route('admin.topics.update', $topic), validTopicData([
            'is_published' => true,
            'title' => 'Another Update',
        ], $this->discipline->id));

    $topic->refresh();
    expect($topic->published_at->toDateTimeString())->toBe($firstPublishedAt);
});

test('preview returns preview page with content', function () {
    $topic = CanonicalTopic::factory()->for($this->discipline)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.topics.preview', $topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/topics/preview')
            ->has('topic.title')
            ->has('topic.content')
            ->has('topic.summary')
            ->has('topic.difficulty_level')
            ->has('topic.estimated_read_minutes')
        );
});

test('togglePublish flips is_published', function () {
    $topic = CanonicalTopic::factory()->for($this->discipline)->unpublished()->create();

    $this->actingAs($this->admin)
        ->post(route('admin.topics.togglePublish', $topic))
        ->assertRedirect()
        ->assertSessionHas('success', 'Topic published.');

    $topic->refresh();
    expect($topic->is_published)->toBeTrue();
    expect($topic->published_at)->not->toBeNull();
});

test('togglePublish sets published_at only on first publish', function () {
    $publishedAt = now()->subWeek();
    $topic = CanonicalTopic::factory()->for($this->discipline)->create([
        'is_published' => true,
        'published_at' => $publishedAt,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.topics.togglePublish', $topic));

    $topic->refresh();
    expect($topic->is_published)->toBeFalse();

    $this->actingAs($this->admin)
        ->post(route('admin.topics.togglePublish', $topic));

    $topic->refresh();
    expect($topic->is_published)->toBeTrue();
    expect($topic->published_at->toDateTimeString())->toBe($publishedAt->toDateTimeString());
});

test('guests cannot access topic routes', function () {
    $this->get(route('admin.topics.index'))->assertRedirect(route('login'));
    $this->get(route('admin.topics.create'))->assertRedirect(route('login'));
});

test('non-staff users get 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.topics.index'))
        ->assertForbidden();
});
