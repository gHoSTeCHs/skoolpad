<?php

use App\Enums\BlockType;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\Discipline;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->discipline = Discipline::factory()->create();
    $this->topic = CanonicalTopic::factory()->for($this->discipline)->create();
});

test('index renders blocks page for a topic', function () {
    ContentBlock::factory()->for($this->topic)->create();

    $this->actingAs($this->admin)
        ->get(route('admin.content-blocks.index', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/topics/blocks')
            ->has('topic.id')
            ->has('topic.title')
            ->has('blocks', 1)
            ->has('blockTypes')
            ->has('difficultyLevels')
            ->has('bloomLevels')
        );
});

test('index shows nested block tree', function () {
    $parent = ContentBlock::factory()->container()->for($this->topic)->create(['path' => '1', 'sort_order' => 1]);
    ContentBlock::factory()->for($this->topic)->create([
        'parent_block_id' => $parent->id,
        'path' => '1.1',
        'depth_level' => 1,
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin)
        ->get(route('admin.content-blocks.index', $this->topic))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('blocks', 1)
            ->where('blocks.0.children', fn ($children) => count($children) === 1)
        );
});

test('store creates root block with correct path and depth', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.content-blocks.store', $this->topic), [
            'title' => 'Introduction',
            'slug' => 'introduction',
            'block_type' => 'text',
            'is_published' => false,
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Block created.');

    $this->assertDatabaseHas('content_blocks', [
        'canonical_topic_id' => $this->topic->id,
        'title' => 'Introduction',
        'path' => '1',
        'depth_level' => 0,
        'sort_order' => 1,
        'parent_block_id' => null,
    ]);
});

test('store creates child block under parent', function () {
    $parent = ContentBlock::factory()->container()->for($this->topic)->create(['path' => '1', 'sort_order' => 1]);

    $this->actingAs($this->admin)
        ->post(route('admin.content-blocks.store', $this->topic), [
            'parent_block_id' => $parent->id,
            'title' => 'Child Block',
            'slug' => 'child-block',
            'block_type' => 'text',
            'is_published' => false,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('content_blocks', [
        'canonical_topic_id' => $this->topic->id,
        'title' => 'Child Block',
        'parent_block_id' => $parent->id,
        'path' => '1.1',
        'depth_level' => 1,
        'sort_order' => 1,
    ]);
});

test('store auto-sets parent as container when adding child', function () {
    $parent = ContentBlock::factory()->for($this->topic)->create([
        'path' => '1',
        'sort_order' => 1,
        'is_container' => false,
        'block_type' => BlockType::Text,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.content-blocks.store', $this->topic), [
            'parent_block_id' => $parent->id,
            'title' => 'Child',
            'slug' => 'child',
            'block_type' => 'text',
            'is_published' => false,
        ])
        ->assertRedirect();

    $parent->refresh();
    expect($parent->is_container)->toBeTrue();
    expect($parent->content)->toBeNull();
    expect($parent->estimated_read_time)->toBeNull();
});

test('update modifies block metadata', function () {
    $block = ContentBlock::factory()->for($this->topic)->create();

    $this->actingAs($this->admin)
        ->put(route('admin.content-blocks.update', $block), [
            'title' => 'Updated Title',
            'slug' => 'updated-title',
            'block_type' => 'code',
            'difficulty_level' => 'advanced',
            'bloom_level' => 'analyze',
            'estimated_read_time' => 20,
            'is_published' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Block updated.');

    $this->assertDatabaseHas('content_blocks', [
        'id' => $block->id,
        'title' => 'Updated Title',
        'slug' => 'updated-title',
        'block_type' => 'code',
        'is_published' => true,
    ]);
});

test('update saves tiptap content for leaf block', function () {
    $block = ContentBlock::factory()->for($this->topic)->create();
    $tiptapContent = [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Hello world']]],
        ],
    ];

    $this->actingAs($this->admin)
        ->put(route('admin.content-blocks.update', $block), [
            'title' => $block->title,
            'slug' => $block->slug,
            'block_type' => $block->block_type->value,
            'content' => $tiptapContent,
            'is_published' => false,
        ])
        ->assertRedirect();

    $block->refresh();
    expect($block->content)->toEqual($tiptapContent);
});

test('destroy deletes block and cascades to children', function () {
    $parent = ContentBlock::factory()->container()->for($this->topic)->create(['path' => '1', 'sort_order' => 1]);
    $child = ContentBlock::factory()->for($this->topic)->create([
        'parent_block_id' => $parent->id,
        'path' => '1.1',
        'depth_level' => 1,
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.content-blocks.destroy', $parent))
        ->assertRedirect()
        ->assertSessionHas('success', 'Block deleted.');

    $this->assertDatabaseMissing('content_blocks', ['id' => $parent->id]);
    $this->assertDatabaseMissing('content_blocks', ['id' => $child->id]);
});

test('destroy reverts parent to non-container when last child deleted', function () {
    $parent = ContentBlock::factory()->container()->for($this->topic)->create(['path' => '1', 'sort_order' => 1]);
    $child = ContentBlock::factory()->for($this->topic)->create([
        'parent_block_id' => $parent->id,
        'path' => '1.1',
        'depth_level' => 1,
        'sort_order' => 1,
    ]);

    $this->actingAs($this->admin)
        ->delete(route('admin.content-blocks.destroy', $child))
        ->assertRedirect();

    $parent->refresh();
    expect($parent->is_container)->toBeFalse();
});

test('reorder updates sort_order and recalculates paths', function () {
    $block1 = ContentBlock::factory()->for($this->topic)->create(['path' => '1', 'sort_order' => 1]);
    $block2 = ContentBlock::factory()->for($this->topic)->create(['path' => '2', 'sort_order' => 2]);

    $this->actingAs($this->admin)
        ->put(route('admin.content-blocks.reorder', $this->topic), [
            'items' => [
                ['id' => $block2->id, 'parent_block_id' => null, 'sort_order' => 1],
                ['id' => $block1->id, 'parent_block_id' => null, 'sort_order' => 2],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Blocks reordered.');

    $block1->refresh();
    $block2->refresh();
    expect($block2->path)->toBe('1');
    expect($block1->path)->toBe('2');
});

test('store validates required fields', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.content-blocks.store', $this->topic), [])
        ->assertSessionHasErrors(['title', 'slug', 'block_type']);
});

test('unauthenticated user is redirected', function () {
    $this->get(route('admin.content-blocks.index', $this->topic))
        ->assertRedirect(route('login'));
});
