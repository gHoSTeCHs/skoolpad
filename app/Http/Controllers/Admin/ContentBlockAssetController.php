<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContentBlockAssetRequest;
use App\Http\Requests\Admin\UpdateContentBlockAssetRequest;
use App\Models\ContentBlockAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * Asset endpoints for the diagram-authoring pipeline (Track 2, Checkpoint 2).
 *
 * One row per drawn diagram. Scope is determined by which owner FK is set
 * (content_block_id | question_id | question_paper_id) — enforced exactly-one
 * at the DB level by `content_block_assets_single_owner_chk`.
 */
class ContentBlockAssetController extends Controller
{
    /**
     * Inertia admin asset browser (Polish A.2). Lists every drawn diagram with
     * its scope, owner label, alt-text status, and timestamps. Lets admins audit
     * for orphaned assets, missing alt-text, and unused diagrams.
     */
    public function adminIndex(Request $request): InertiaResponse
    {
        $assets = ContentBlockAsset::query()
            ->with([
                'contentBlock:id,title,canonical_topic_id',
                'question:id,content,question_paper_id,institution_course_id',
                'questionPaper:id,title',
                'creator:id,name',
            ])
            ->latest('updated_at')
            ->limit(500)
            ->get();

        return Inertia::render('admin/canvas-assets/index', [
            'assets' => $assets->map(fn (ContentBlockAsset $a) => [
                'id' => $a->id,
                'kind' => $a->kind->value,
                'scope' => $a->ownerScope(),
                'owner_label' => $this->ownerLabel($a),
                'owner_url' => $this->ownerUrl($a),
                'alt_text' => $a->alt_text,
                'caption' => $a->caption,
                'has_alt_text' => filled($a->alt_text),
                'has_svg' => filled($a->svg_payload),
                'svg_url' => route('admin.assets.svg', $a),
                'created_by_name' => $a->creator?->name,
                'created_at' => $a->created_at?->toIso8601String(),
                'updated_at' => $a->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function store(StoreContentBlockAssetRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $asset = ContentBlockAsset::query()->create($data);

        return response()->json([
            'asset' => $this->serialize($asset),
        ], 201);
    }

    public function show(Request $request, ContentBlockAsset $asset): JsonResponse
    {
        return response()->json([
            'asset' => $this->serialize($asset),
        ]);
    }

    /** Inertia destroy — admin asset browser triggers this; tree-cascade still works via the DB FKs. */
    public function adminDestroy(Request $request, ContentBlockAsset $asset): RedirectResponse
    {
        $asset->delete();

        return back()->with('success', 'Asset deleted.');
    }

    /** Best-effort human-readable label for an asset's owner. */
    private function ownerLabel(ContentBlockAsset $a): string
    {
        if ($a->content_block_id && $a->contentBlock) {
            return $a->contentBlock->title ?: 'Untitled block';
        }
        if ($a->question_id && $a->question) {
            $stem = trim(strip_tags((string) $a->question->content));

            return $stem === '' ? 'Untitled question' : mb_strimwidth($stem, 0, 80, '…');
        }
        if ($a->question_paper_id && $a->questionPaper) {
            return $a->questionPaper->title ?: 'Untitled paper';
        }

        return 'Orphan asset';
    }

    /** Best-effort link to where the asset lives. Null for orphans. */
    private function ownerUrl(ContentBlockAsset $a): ?string
    {
        if ($a->question_id && $a->question?->question_paper_id) {
            return route('admin.question-papers.build', $a->question->question_paper_id);
        }
        if ($a->question_paper_id) {
            return route('admin.question-papers.build', $a->question_paper_id);
        }
        if ($a->content_block_id && $a->contentBlock?->canonical_topic_id) {
            return route('admin.topics.preview', $a->contentBlock->canonical_topic_id);
        }

        return null;
    }

    public function update(UpdateContentBlockAssetRequest $request, ContentBlockAsset $asset): JsonResponse
    {
        $asset->update($request->validated());

        return response()->json([
            'asset' => $this->serialize($asset->refresh()),
        ]);
    }

    /**
     * Serve the cached SVG payload directly with image content-type so it can be
     * used as an <img src="..."> target (e.g. for DiagramLabel question backgrounds).
     */
    public function svg(Request $request, ContentBlockAsset $asset): \Illuminate\Http\Response
    {
        $payload = $asset->svg_payload ?? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';

        return response($payload, 200, [
            'Content-Type' => 'image/svg+xml',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    /** @return array<string, mixed> */
    private function serialize(ContentBlockAsset $asset): array
    {
        return [
            'id' => $asset->id,
            'kind' => $asset->kind->value,
            'scope' => $asset->ownerScope(),
            'content_block_id' => $asset->content_block_id,
            'question_id' => $asset->question_id,
            'question_paper_id' => $asset->question_paper_id,
            'excalidraw_json' => $asset->excalidraw_json,
            'svg_payload' => $asset->svg_payload,
            'alt_text' => $asset->alt_text,
            'caption' => $asset->caption,
            'created_by' => $asset->created_by,
            'created_at' => $asset->created_at?->toIso8601String(),
            'updated_at' => $asset->updated_at?->toIso8601String(),
        ];
    }
}
