<?php

use App\Enums\ContentProjectStatus;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Models\ContentProject;
use App\Models\LevelSubject;
use App\Models\SchemeOfWorkItem;
use App\Models\User;

function sampleBlockStructure(): array
{
    return [
        'topic_key' => 'introduction-to-physics',
        'topic_title' => 'Introduction to Physics',
        'topic_slug' => 'introduction-to-physics',
        'topic_summary' => 'An overview of physics as a discipline, its branches, and career opportunities.',
        'estimated_total_minutes' => 35,
        'blocks' => [
            ['title' => 'Introduction to Physics', 'slug' => 'introduction-to-physics', 'block_type' => 'container', 'is_container' => true, 'depth_level' => 0, 'parent_index' => null, 'sort_order' => 1, 'estimated_read_time' => null, 'difficulty_level' => null, 'bloom_level' => null, 'visualization' => ['recommended' => false], 'content_guidance' => 'Root container.'],
            ['title' => 'What is Physics?', 'slug' => 'what-is-physics', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 1, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'Define physics and explain what physicists study.'],
            ['title' => 'Branches of Physics', 'slug' => 'branches-of-physics', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 2, 'estimated_read_time' => 7, 'difficulty_level' => 'beginner', 'bloom_level' => 'understand', 'visualization' => ['recommended' => true, 'priority' => 'medium', 'primitive_type' => 'process_flow', 'interaction_mode' => 'interactive', 'description' => 'Interactive map showing branches of physics.'], 'content_guidance' => 'Explain the main branches: mechanics, thermodynamics, optics, etc.'],
            ['title' => 'Physics in Nigeria', 'slug' => 'physics-in-nigeria', 'block_type' => 'example', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 3, 'estimated_read_time' => 6, 'difficulty_level' => 'beginner', 'bloom_level' => 'understand', 'visualization' => ['recommended' => false], 'content_guidance' => 'Real-world physics examples from Nigerian context.'],
            ['title' => 'Quick Check', 'slug' => 'quick-check', 'block_type' => 'quiz', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 4, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'apply', 'visualization' => ['recommended' => false], 'content_guidance' => '3 quick questions to check understanding.'],
            ['title' => 'Key Terms and Formulas', 'slug' => 'key-terms', 'block_type' => 'reference', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 0, 'sort_order' => 5, 'estimated_read_time' => 4, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'Summary of key physics terms introduced.'],
        ],
    ];
}

it('approves block structure and creates CanonicalTopic with correct fields', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $data = sampleBlockStructure();

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), $data)
        ->assertRedirect();

    $topic = CanonicalTopic::query()->where('slug', 'introduction-to-physics')->first();

    expect($topic)->not->toBeNull()
        ->and($topic->title)->toBe('Introduction to Physics')
        ->and($topic->summary)->toBe('An overview of physics as a discipline, its branches, and career opportunities.')
        ->and($topic->estimated_read_minutes)->toBe(35)
        ->and($topic->education_level)->toBe('secondary')
        ->and($topic->is_published)->toBeFalse()
        ->and($topic->discipline_id)->not->toBeNull();
});

it('creates correct ContentBlock hierarchy with paths and depths', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), sampleBlockStructure())
        ->assertRedirect();

    $topic = CanonicalTopic::query()->where('slug', 'introduction-to-physics')->first();
    $blocks = ContentBlock::query()
        ->where('canonical_topic_id', $topic->id)
        ->orderBy('path')
        ->get();

    expect($blocks)->toHaveCount(6);

    $root = $blocks->firstWhere('depth_level', 0);
    expect($root)->not->toBeNull()
        ->and($root->is_container)->toBeTrue()
        ->and($root->block_type->value)->toBe('container')
        ->and($root->path)->toBe('1');

    $firstLeaf = $blocks->firstWhere('title', 'What is Physics?');
    expect($firstLeaf)->not->toBeNull()
        ->and($firstLeaf->depth_level)->toBe(1)
        ->and($firstLeaf->block_type->value)->toBe('text')
        ->and($firstLeaf->bloom_level->value)->toBe('remember')
        ->and($firstLeaf->difficulty_level->value)->toBe('beginner')
        ->and($firstLeaf->estimated_read_time)->toBe(5)
        ->and($firstLeaf->parent_block_id)->toBe($root->id);

    $vizBlock = $blocks->firstWhere('title', 'Branches of Physics');
    expect($vizBlock->visualization_config)->not->toBeNull()
        ->and($vizBlock->visualization_config['recommended'])->toBeTrue()
        ->and($vizBlock->visualization_config['primitive_type'])->toBe('process_flow');

    $reference = $blocks->firstWhere('title', 'Key Terms and Formulas');
    expect($reference->block_type->value)->toBe('reference');
});

it('links SchemeOfWorkItem canonical_topic_id after block approval', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $levelSubject = LevelSubject::query()->firstOrCreate([
        'education_level_id' => $project->education_level_id,
        'curriculum_subject_id' => $project->curriculum_subject_id,
    ]);

    SchemeOfWorkItem::query()->create([
        'curriculum_subject_level_id' => $levelSubject->id,
        'term' => 1,
        'week_number' => 1,
        'topic_label' => 'Introduction to Physics',
    ]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), sampleBlockStructure())
        ->assertRedirect();

    $topic = CanonicalTopic::query()->where('slug', 'introduction-to-physics')->first();
    $item = SchemeOfWorkItem::query()
        ->where('curriculum_subject_level_id', $levelSubject->id)
        ->where('topic_label', 'Introduction to Physics')
        ->first();

    expect($item->canonical_topic_id)->toBe($topic->id);
});

it('tracks block approval in progress_data', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), sampleBlockStructure())
        ->assertRedirect();

    $project->refresh();
    $approved = $project->progress_data['blocks_approved'] ?? [];

    expect($approved)->toHaveKey('introduction-to-physics')
        ->and($approved['introduction-to-physics']['topic_id'])->not->toBeNull()
        ->and($approved['introduction-to-physics']['approved_at'])->not->toBeNull();
});

it('enforces depth limit of 5 via validation', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $data = sampleBlockStructure();
    $data['blocks'][1]['depth_level'] = 6;

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), $data)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['blocks.1.depth_level']);
});

it('requires minimum 4 blocks', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $data = sampleBlockStructure();
    $data['blocks'] = array_slice($data['blocks'], 0, 3);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), $data)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['blocks']);
});

it('prevents block approval when project is not in structuring status', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()
        ->withStatus(ContentProjectStatus::Draft)
        ->create(['created_by' => $user->id]);

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), sampleBlockStructure())
        ->assertRedirect()
        ->assertSessionHas('error');
});

it('processes blocks in depth order when AI returns them out of order', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $data = [
        'topic_key' => 'introduction-to-physics',
        'topic_title' => 'Introduction to Physics',
        'topic_slug' => 'introduction-to-physics',
        'topic_summary' => 'Overview.',
        'estimated_total_minutes' => 25,
        'blocks' => [
            ['title' => 'Leaf A', 'slug' => 'leaf-a', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 4, 'sort_order' => 1, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'A.'],
            ['title' => 'Leaf B', 'slug' => 'leaf-b', 'block_type' => 'text', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 4, 'sort_order' => 2, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'understand', 'visualization' => ['recommended' => false], 'content_guidance' => 'B.'],
            ['title' => 'Leaf C', 'slug' => 'leaf-c', 'block_type' => 'quiz', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 4, 'sort_order' => 3, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'apply', 'visualization' => ['recommended' => false], 'content_guidance' => 'C.'],
            ['title' => 'Leaf D', 'slug' => 'leaf-d', 'block_type' => 'reference', 'is_container' => false, 'depth_level' => 1, 'parent_index' => 4, 'sort_order' => 4, 'estimated_read_time' => 5, 'difficulty_level' => 'beginner', 'bloom_level' => 'remember', 'visualization' => ['recommended' => false], 'content_guidance' => 'D.'],
            ['title' => 'Root Container', 'slug' => 'root-container', 'block_type' => 'container', 'is_container' => true, 'depth_level' => 0, 'parent_index' => null, 'sort_order' => 1, 'estimated_read_time' => null, 'difficulty_level' => null, 'bloom_level' => null, 'visualization' => ['recommended' => false], 'content_guidance' => 'Root.'],
        ],
    ];

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), $data)
        ->assertRedirect();

    $topic = CanonicalTopic::query()->where('slug', 'introduction-to-physics')->first();
    $blocks = ContentBlock::query()->where('canonical_topic_id', $topic->id)->get();

    expect($blocks)->toHaveCount(5);

    $root = $blocks->firstWhere('depth_level', 0);
    expect($root)->not->toBeNull();

    $leafBlocks = $blocks->where('is_container', false);
    expect($leafBlocks)->toHaveCount(4);

    foreach ($leafBlocks as $leaf) {
        expect($leaf->parent_block_id)->toBe($root->id);
    }
});

it('can approve multiple topics sequentially', function () {
    $user = User::factory()->admin()->create();
    $project = ContentProject::factory()->withApprovedScheme()->create(['created_by' => $user->id]);

    $firstTopic = sampleBlockStructure();
    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project), $firstTopic)
        ->assertRedirect();

    $secondTopic = sampleBlockStructure();
    $secondTopic['topic_key'] = 'measurement';
    $secondTopic['topic_title'] = 'Measurement';
    $secondTopic['topic_slug'] = 'measurement';
    $secondTopic['topic_summary'] = 'Units, instruments, and measurement techniques.';

    $this->actingAs($user)
        ->postJson(route('admin.content-studio.approve-blocks', $project->fresh()), $secondTopic)
        ->assertRedirect();

    expect(CanonicalTopic::query()->where('slug', 'introduction-to-physics')->exists())->toBeTrue()
        ->and(CanonicalTopic::query()->where('slug', 'measurement')->exists())->toBeTrue();

    $project->refresh();
    $approved = $project->progress_data['blocks_approved'];
    expect($approved)->toHaveKey('introduction-to-physics')
        ->and($approved)->toHaveKey('measurement');
});
