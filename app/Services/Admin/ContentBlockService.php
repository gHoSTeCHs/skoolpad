<?php

namespace App\Services\Admin;

use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use Illuminate\Support\Facades\DB;

class ContentBlockService
{
    public function createBlock(CanonicalTopic $topic, array $data): ContentBlock
    {
        $data['canonical_topic_id'] = $topic->id;
        $parentId = $data['parent_block_id'] ?? null;

        if ($parentId) {
            $parent = ContentBlock::query()->findOrFail($parentId);
            $siblingCount = ContentBlock::query()->where('parent_block_id', $parentId)->count();
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

        return ContentBlock::query()->create($data);
    }

    public function deleteBlock(ContentBlock $block): void
    {
        $topicId = $block->canonical_topic_id;
        $parentId = $block->parent_block_id;

        $block->delete();

        if ($parentId) {
            $remainingChildren = ContentBlock::query()->where('parent_block_id', $parentId)->count();
            if ($remainingChildren === 0) {
                ContentBlock::query()->where('id', $parentId)->update(['is_container' => false]);
            }
        }

        DB::transaction(function () use ($topicId, $parentId) {
            ContentBlock::query()->where('canonical_topic_id', $topicId)
                ->where('parent_block_id', $parentId)
                ->get()
                ->each(fn (ContentBlock $b) => $b->updateQuietly(['path' => "tmp_{$b->id}"]));

            $this->recalculatePaths($topicId, $parentId);
        });
    }

    public function reorderBlocks(CanonicalTopic $topic, array $items): void
    {
        foreach ($items as $item) {
            ContentBlock::query()->where('id', $item['id'])->update([
                'parent_block_id' => $item['parent_block_id'],
                'sort_order' => $item['sort_order'],
            ]);
        }

        $this->recalculateAllPaths($topic);
    }

    private function recalculatePaths(string $topicId, ?string $parentId): void
    {
        $siblings = ContentBlock::query()->where('canonical_topic_id', $topicId)
            ->where('parent_block_id', $parentId)
            ->orderBy('sort_order')
            ->get();

        $parentPath = $parentId ? ContentBlock::query()->find($parentId)?->path : null;

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
            ContentBlock::query()->where('canonical_topic_id', $topic->id)
                ->get()
                ->each(fn (ContentBlock $block) => $block->updateQuietly(['path' => "tmp_{$block->id}"]));

            $this->recalculatePaths($topic->id, null);
        });
    }
}
