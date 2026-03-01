<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContentBlockRequest;
use App\Http\Requests\Admin\UpdateContentBlockRequest;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContentBlockController extends Controller
{
    public function index(CanonicalTopic $topic): Response
    {
        $blocks = $topic->contentBlocks()
            ->whereNull('parent_block_id')
            ->with($this->blockTreeWith())
            ->orderBy('sort_order')
            ->get();

        $availableBlocks = $topic->contentBlocks()
            ->select('id', 'title')
            ->orderBy('path')
            ->get()
            ->map(fn (ContentBlock $b) => ['id' => $b->id, 'title' => $b->title])
            ->values()
            ->all();

        return Inertia::render('admin/topics/blocks', [
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'slug' => $topic->slug,
            ],
            'blocks' => $this->buildTree($blocks),
            'blockTypes' => BlockType::toSelectOptions(),
            'difficultyLevels' => BlockDifficultyLevel::toSelectOptions(),
            'bloomLevels' => BloomLevel::toSelectOptions(),
            'availableBlocks' => $availableBlocks,
        ]);
    }

    public function store(StoreContentBlockRequest $request, CanonicalTopic $topic): RedirectResponse
    {
        $data = $request->validated();
        $data['canonical_topic_id'] = $topic->id;

        $parentId = $data['parent_block_id'] ?? null;

        if ($parentId) {
            $parent = ContentBlock::findOrFail($parentId);
            $siblingCount = ContentBlock::where('parent_block_id', $parentId)->count();
            $data['depth_level'] = $parent->depth_level + 1;
            $data['path'] = $parent->path.'.'.($siblingCount + 1);
            $data['sort_order'] = $siblingCount + 1;

            if (! $parent->is_container) {
                $parent->update(['is_container' => true, 'content' => null, 'estimated_read_time' => null]);
            }
        } else {
            $siblingCount = $topic->contentBlocks()->whereNull('parent_block_id')->count();
            $data['depth_level'] = 0;
            $data['path'] = (string) ($siblingCount + 1);
            $data['sort_order'] = $siblingCount + 1;
        }

        ContentBlock::create($data);

        return back()->with('success', 'Block created.');
    }

    public function update(UpdateContentBlockRequest $request, ContentBlock $block): RedirectResponse
    {
        $data = $request->validated();
        $prerequisites = $data['prerequisites'] ?? [];
        unset($data['prerequisites']);

        $block->update($data);
        $block->syncPrerequisites($prerequisites);

        return back()->with('success', 'Block updated.');
    }

    public function destroy(ContentBlock $block): RedirectResponse
    {
        $topicId = $block->canonical_topic_id;
        $parentId = $block->parent_block_id;

        $block->delete();

        if ($parentId) {
            $remainingChildren = ContentBlock::where('parent_block_id', $parentId)->count();
            if ($remainingChildren === 0) {
                ContentBlock::where('id', $parentId)->update(['is_container' => false]);
            }
        }

        DB::transaction(function () use ($topicId, $parentId) {
            ContentBlock::where('canonical_topic_id', $topicId)
                ->where('parent_block_id', $parentId)
                ->get()
                ->each(fn (ContentBlock $b) => $b->updateQuietly(['path' => "tmp_{$b->id}"]));

            $this->recalculatePaths($topicId, $parentId);
        });

        return back()->with('success', 'Block deleted.');
    }

    public function reorder(Request $request, CanonicalTopic $topic): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'uuid', 'exists:content_blocks,id'],
            'items.*.parent_block_id' => ['nullable', 'uuid', 'exists:content_blocks,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:1'],
        ]);

        foreach ($validated['items'] as $item) {
            ContentBlock::where('id', $item['id'])->update([
                'parent_block_id' => $item['parent_block_id'],
                'sort_order' => $item['sort_order'],
            ]);
        }

        $this->recalculateAllPaths($topic);

        return back()->with('success', 'Blocks reordered.');
    }

    /** @return array<string, mixed> */
    private function blockTreeWith(int $depth = 0): array
    {
        if ($depth >= 5) {
            return ['prerequisites:content_blocks.id,content_blocks.title'];
        }

        return [
            'prerequisites:content_blocks.id,content_blocks.title',
            'children' => fn ($q) => $q->orderBy('sort_order')->with($this->blockTreeWith($depth + 1)),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    private function buildTree($blocks): array
    {
        return $blocks->map(function (ContentBlock $block) {
            return [
                'id' => $block->id,
                'parent_block_id' => $block->parent_block_id,
                'title' => $block->title,
                'slug' => $block->slug,
                'block_type' => $block->block_type->value,
                'block_type_label' => $block->block_type->label(),
                'path' => $block->path,
                'depth_level' => $block->depth_level,
                'sort_order' => $block->sort_order,
                'content' => $block->content,
                'estimated_read_time' => $block->estimated_read_time,
                'difficulty_level' => $block->difficulty_level?->value,
                'bloom_level' => $block->bloom_level?->value,
                'is_container' => $block->is_container,
                'is_published' => $block->is_published,
                'prerequisites' => $block->prerequisites->map(fn ($prereq) => [
                    'id' => $prereq->id,
                    'title' => $prereq->title,
                    'is_hard_prerequisite' => (bool) $prereq->pivot->is_hard_prerequisite,
                ])->values()->all(),
                'children' => $block->children->isNotEmpty() ? $this->buildTree($block->children->sortBy('sort_order')->values()) : [],
            ];
        })->values()->all();
    }

    private function recalculatePaths(string $topicId, ?string $parentId): void
    {
        $siblings = ContentBlock::where('canonical_topic_id', $topicId)
            ->where('parent_block_id', $parentId)
            ->orderBy('sort_order')
            ->get();

        $parentPath = $parentId ? ContentBlock::find($parentId)?->path : null;

        foreach ($siblings as $index => $sibling) {
            $newOrder = $index + 1;
            $newPath = $parentPath ? "{$parentPath}.{$newOrder}" : (string) $newOrder;
            $sibling->update(['sort_order' => $newOrder, 'path' => $newPath]);
            $this->recalculateChildPaths($sibling);
        }
    }

    private function recalculateChildPaths(ContentBlock $block): void
    {
        $children = $block->children()->orderBy('sort_order')->get();
        foreach ($children as $index => $child) {
            $newOrder = $index + 1;
            $newPath = "{$block->path}.{$newOrder}";
            $child->update([
                'sort_order' => $newOrder,
                'path' => $newPath,
                'depth_level' => $block->depth_level + 1,
            ]);
            $this->recalculateChildPaths($child);
        }
    }

    private function recalculateAllPaths(CanonicalTopic $topic): void
    {
        DB::transaction(function () use ($topic) {
            ContentBlock::where('canonical_topic_id', $topic->id)
                ->get()
                ->each(fn (ContentBlock $block) => $block->updateQuietly(['path' => "tmp_{$block->id}"]));

            $this->recalculatePaths($topic->id, null);
        });
    }
}
