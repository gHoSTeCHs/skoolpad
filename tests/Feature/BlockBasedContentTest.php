<?php

use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use App\Enums\TeachingDepth;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\CourseBlockMapping;
use App\Models\InstitutionCourse;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;

test('content block can be created with factory', function () {
    $block = ContentBlock::factory()->create();

    expect($block)->toBeInstanceOf(ContentBlock::class)
        ->and($block->block_type)->toBeInstanceOf(BlockType::class)
        ->and($block->content)->toBeArray()
        ->and($block->is_container)->toBeFalse();
});

test('content block container state nulls content fields', function () {
    $block = ContentBlock::factory()->container()->create();

    expect($block->is_container)->toBeTrue()
        ->and($block->block_type)->toBe(BlockType::Container)
        ->and($block->content)->toBeNull()
        ->and($block->estimated_read_time)->toBeNull()
        ->and($block->difficulty_level)->toBeNull()
        ->and($block->bloom_level)->toBeNull();
});

test('content block belongs to canonical topic', function () {
    $topic = CanonicalTopic::factory()->create();
    $block = ContentBlock::factory()->create(['canonical_topic_id' => $topic->id]);

    expect($block->canonicalTopic->id)->toBe($topic->id);
});

test('content block self-referential parent-child relationship', function () {
    $topic = CanonicalTopic::factory()->create();
    $parent = ContentBlock::factory()->container()->create([
        'canonical_topic_id' => $topic->id,
        'path' => '1',
        'depth_level' => 0,
    ]);
    $child1 = ContentBlock::factory()->create([
        'canonical_topic_id' => $topic->id,
        'parent_block_id' => $parent->id,
        'path' => '1.1',
        'depth_level' => 1,
        'sort_order' => 1,
    ]);
    $child2 = ContentBlock::factory()->create([
        'canonical_topic_id' => $topic->id,
        'parent_block_id' => $parent->id,
        'path' => '1.2',
        'depth_level' => 1,
        'sort_order' => 2,
    ]);

    expect($parent->children)->toHaveCount(2)
        ->and($child1->parent->id)->toBe($parent->id)
        ->and($child2->parent->id)->toBe($parent->id);
});

test('canonical topic has many content blocks', function () {
    $topic = CanonicalTopic::factory()->create();
    ContentBlock::factory()->create(['canonical_topic_id' => $topic->id, 'path' => '1']);
    ContentBlock::factory()->create(['canonical_topic_id' => $topic->id, 'path' => '2']);

    expect($topic->contentBlocks)->toHaveCount(2);
});

test('content block depth level check constraint prevents values over 5', function () {
    expect(fn () => ContentBlock::factory()->create(['depth_level' => 6]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('content block unique constraint on topic and path', function () {
    $topic = CanonicalTopic::factory()->create();
    ContentBlock::factory()->create(['canonical_topic_id' => $topic->id, 'path' => '1.1']);

    expect(fn () => ContentBlock::factory()->create([
        'canonical_topic_id' => $topic->id,
        'path' => '1.1',
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('content block casts difficulty and bloom levels', function () {
    $block = ContentBlock::factory()->create([
        'difficulty_level' => BlockDifficultyLevel::Intermediate,
        'bloom_level' => BloomLevel::Apply,
    ]);

    expect($block->difficulty_level)->toBe(BlockDifficultyLevel::Intermediate)
        ->and($block->bloom_level)->toBe(BloomLevel::Apply);
});

test('course block mapping for institution course', function () {
    $course = InstitutionCourse::factory()->create();
    $block = ContentBlock::factory()->create();
    $mapping = CourseBlockMapping::factory()->create([
        'institution_course_id' => $course->id,
        'content_block_id' => $block->id,
    ]);

    expect($mapping->institutionCourse->id)->toBe($course->id)
        ->and($mapping->contentBlock->id)->toBe($block->id)
        ->and($mapping->teaching_depth)->toBeInstanceOf(TeachingDepth::class);
});

test('course block mapping for level subject', function () {
    $levelSubject = LevelSubject::factory()->create();
    $block = ContentBlock::factory()->create();
    $mapping = CourseBlockMapping::factory()->forLevelSubject()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'content_block_id' => $block->id,
    ]);

    expect($mapping->levelSubject->id)->toBe($levelSubject->id)
        ->and($mapping->institution_course_id)->toBeNull();
});

test('course block mapping xor constraint rejects both null', function () {
    expect(fn () => CourseBlockMapping::factory()->create([
        'institution_course_id' => null,
        'curriculum_subject_level_id' => null,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('course block mapping xor constraint rejects both set', function () {
    $course = InstitutionCourse::factory()->create();
    $levelSubject = LevelSubject::factory()->create();

    expect(fn () => CourseBlockMapping::factory()->create([
        'institution_course_id' => $course->id,
        'curriculum_subject_level_id' => $levelSubject->id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('content block has many course block mappings', function () {
    $block = ContentBlock::factory()->create();
    CourseBlockMapping::factory()->create(['content_block_id' => $block->id]);
    CourseBlockMapping::factory()->forLevelSubject()->create(['content_block_id' => $block->id]);

    expect($block->courseBlockMappings)->toHaveCount(2);
});

test('institution course has many course block mappings', function () {
    $course = InstitutionCourse::factory()->create();
    $block1 = ContentBlock::factory()->create();
    $block2 = ContentBlock::factory()->create();
    CourseBlockMapping::factory()->create(['institution_course_id' => $course->id, 'content_block_id' => $block1->id]);
    CourseBlockMapping::factory()->create(['institution_course_id' => $course->id, 'content_block_id' => $block2->id]);

    expect($course->courseBlockMappings)->toHaveCount(2);
});

test('scheme of work item can be created', function () {
    $item = SchemeOfWorkItem::factory()->create();

    expect($item)->toBeInstanceOf(SchemeOfWorkItem::class)
        ->and($item->term)->toBeInt()
        ->and($item->week_number)->toBeInt();
});

test('scheme of work item belongs to level subject', function () {
    $levelSubject = LevelSubject::factory()->create();
    $item = SchemeOfWorkItem::factory()->create(['curriculum_subject_level_id' => $levelSubject->id]);

    expect($item->levelSubject->id)->toBe($levelSubject->id);
});

test('scheme of work item optional canonical topic link', function () {
    $topic = CanonicalTopic::factory()->create();
    $item = SchemeOfWorkItem::factory()->create(['canonical_topic_id' => $topic->id]);

    expect($item->canonicalTopic->id)->toBe($topic->id);
});

test('scheme of work item optional content block link', function () {
    $block = ContentBlock::factory()->create();
    $item = SchemeOfWorkItem::factory()->create(['content_block_id' => $block->id]);

    expect($item->contentBlock->id)->toBe($block->id);
});

test('scheme of work unique constraint on subject-term-week', function () {
    $levelSubject = LevelSubject::factory()->create();
    SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 1,
    ]);

    expect(fn () => SchemeOfWorkItem::factory()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 1,
    ]))->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});

test('level subject has many scheme of work items', function () {
    $levelSubject = LevelSubject::factory()->create();
    SchemeOfWorkItem::factory()->create(['curriculum_subject_level_id' => $levelSubject->id, 'term' => 1, 'week_number' => 1]);
    SchemeOfWorkItem::factory()->create(['curriculum_subject_level_id' => $levelSubject->id, 'term' => 1, 'week_number' => 2]);

    expect($levelSubject->schemeOfWorkItems)->toHaveCount(2);
});

test('cascade delete removes content blocks when topic is deleted', function () {
    $topic = CanonicalTopic::factory()->create();
    ContentBlock::factory()->create(['canonical_topic_id' => $topic->id, 'path' => '1']);
    ContentBlock::factory()->create(['canonical_topic_id' => $topic->id, 'path' => '2']);

    expect(ContentBlock::where('canonical_topic_id', $topic->id)->count())->toBe(2);

    $topic->delete();

    expect(ContentBlock::where('canonical_topic_id', $topic->id)->count())->toBe(0);
});
