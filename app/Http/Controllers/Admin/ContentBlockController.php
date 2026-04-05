<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BlockDifficultyLevel;
use App\Enums\BlockType;
use App\Enums\BloomLevel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderContentBlocksRequest;
use App\Http\Requests\Admin\StoreContentBlockRequest;
use App\Http\Requests\Admin\UpdateContentBlockRequest;
use App\Models\CanonicalTopic;
use App\Models\ContentBlock;
use App\Services\Admin\ContentBlockService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContentBlockController extends Controller
{
    public function __construct(
        private readonly ContentBlockService $contentBlockService,
    ) {}

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
        $this->contentBlockService->createBlock($topic, $request->validated());

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
        $this->contentBlockService->deleteBlock($block);

        return back()->with('success', 'Block deleted.');
    }

    public function reorder(ReorderContentBlocksRequest $request, CanonicalTopic $topic): RedirectResponse
    {
        $this->contentBlockService->reorderBlocks($topic, $request->validated('items'));

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
                'simplified_content' => $block->simplified_content,
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
}
