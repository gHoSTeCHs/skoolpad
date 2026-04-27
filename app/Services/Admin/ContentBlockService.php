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

        return DB::transaction(function () use ($topic, $data, $parentId) {
            if ($parentId) {
                $parent = ContentBlock::query()->lockForUpdate()->findOrFail($parentId);
                $siblingCount = ContentBlock::query()->where('parent_block_id', $parentId)->count();
                $data['depth_level'] = $parent->depth_level + 1;
                $data['path'] = $parent->path.'.'.($siblingCount + 1);
                $data['sort_order'] = $siblingCount + 1;

                if (! $parent->is_container) {
                    $parent->update(['is_container' => true, 'content' => null, 'estimated_read_time' => null]);
                }
            } else {
                CanonicalTopic::query()->lockForUpdate()->find($topic->id);
                $siblingCount = ContentBlock::query()
                    ->where('canonical_topic_id', $topic->id)
                    ->whereNull('parent_block_id')
                    ->count();
                $data['depth_level'] = 0;
                $data['path'] = (string) ($siblingCount + 1);
                $data['sort_order'] = $siblingCount + 1;
            }

            return ContentBlock::query()->create($data);
        });
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
        DB::transaction(function () use ($topic, $items) {
            if (! empty($items)) {
                $params = [];
                $valueSets = [];

                foreach ($items as $item) {
                    $valueSets[] = '(?::uuid, ?::uuid, ?::int)';
                    $params[] = $item['id'];
                    $params[] = $item['parent_block_id'];
                    $params[] = $item['sort_order'];
                }

                DB::statement(
                    'UPDATE content_blocks AS cb SET parent_block_id = v.parent_block_id, sort_order = v.sort_order FROM (VALUES '.implode(', ', $valueSets).') AS v(id, parent_block_id, sort_order) WHERE cb.id = v.id',
                    $params
                );
            }

            $this->recalculateAllPaths($topic);
        });
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
        $descendants = ContentBlock::query()
            ->where('canonical_topic_id', $block->canonical_topic_id)
            ->where('path', 'like', $block->path.'.%')
            ->orderByRaw("array_length(string_to_array(path, '.'), 1)")
            ->orderBy('sort_order')
            ->get(['id', 'parent_block_id', 'path', 'sort_order', 'depth_level']);

        if ($descendants->isEmpty()) {
            return;
        }

        $byParent = $descendants->groupBy('parent_block_id');
        $resolvedPath = [$block->id => $block->path];
        $resolvedDepth = [$block->id => $block->depth_level];

        $updates = [];
        $queue = [$block->id];

        while (! empty($queue)) {
            $parentId = array_shift($queue);
            $children = $byParent->get($parentId, collect())->sortBy('sort_order')->values();

            foreach ($children as $i => $child) {
                $newOrder = $i + 1;
                $newPath = $resolvedPath[$parentId].'.'.$newOrder;
                $newDepth = $resolvedDepth[$parentId] + 1;
                $updates[] = [$child->id, $newPath, $newDepth, $newOrder];
                $resolvedPath[$child->id] = $newPath;
                $resolvedDepth[$child->id] = $newDepth;
                $queue[] = $child->id;
            }
        }

        if (empty($updates)) {
            return;
        }

        $valueSets = [];
        $params = [];
        foreach ($updates as [$id, $path, $depth, $order]) {
            $valueSets[] = '(?::uuid, ?, ?::int, ?::int)';
            array_push($params, $id, $path, $depth, $order);
        }

        DB::statement(
            'UPDATE content_blocks AS cb
             SET path = v.path, depth_level = v.depth_level, sort_order = v.sort_order
             FROM (VALUES '.implode(', ', $valueSets).') AS v(id, path, depth_level, sort_order)
             WHERE cb.id = v.id',
            $params
        );
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
