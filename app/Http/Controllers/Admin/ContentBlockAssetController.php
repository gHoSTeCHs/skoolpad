<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContentBlockAssetRequest;
use App\Http\Requests\Admin\UpdateContentBlockAssetRequest;
use App\Models\ContentBlockAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Asset endpoints for the diagram-authoring pipeline (Track 2, Checkpoint 2).
 *
 * One row per drawn diagram. Scope is determined by which owner FK is set
 * (content_block_id | question_id | question_paper_id) — enforced exactly-one
 * at the DB level by `content_block_assets_single_owner_chk`.
 */
class ContentBlockAssetController extends Controller
{
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
