<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StencilCategory;
use App\Enums\StencilLicense;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCanvasStencilRequest;
use App\Http\Requests\Admin\UpdateCanvasStencilRequest;
use App\Models\CanvasStencil;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * CRUD + browse endpoints for the canvas STEM stencil library (Track 2 CP11).
 *
 * Storage today: public/stencils/{category}/{slug}.svg (path stored on row).
 * Phase 6: same shape, R2-backed — only the URL host changes.
 */
class CanvasStencilController extends Controller
{
    /**
     * Lightweight catalog endpoint consumed by the Excalidraw modal sidebar.
     * Returns the active stencils ordered by category + sort_order. Lazy-loads
     * SVG bodies on click via {@see CanvasStencilController::show}.
     */
    public function catalog(Request $request): JsonResponse
    {
        $stencils = CanvasStencil::query()
            ->where('is_active', true)
            ->orderBy('category')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $categories = collect(StencilCategory::cases())->map(fn ($c) => [
            'value' => $c->value,
            'label' => $c->label(),
        ]);

        return response()->json([
            'categories' => $categories,
            'stencils' => $stencils->map(fn (CanvasStencil $s) => $this->serializeForBrowse($s))->values(),
        ]);
    }

    /**
     * Inertia page — admin stencil management. Renders the editorial specimen
     * grid. SVG bodies are NOT inlined into the payload; cards fetch them lazily
     * via the public svg endpoint (cacheable, keeps the Inertia payload small).
     */
    public function index(Request $request): InertiaResponse
    {
        $stencils = CanvasStencil::query()
            ->orderBy('category')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/canvas-stencils/index', [
            'stencils' => $stencils->map(fn (CanvasStencil $s) => $this->serializeFull($s))->values(),
            'categories' => collect(StencilCategory::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
            'licenses' => collect(StencilLicense::cases())->map(fn ($l) => [
                'value' => $l->value,
                'label' => $l->label(),
                'requires_attribution' => $l->requiresAttribution(),
            ]),
        ]);
    }

    /**
     * JSON catalog kept under a different name so admin-page mounts (consumes
     * /admin/canvas-stencils as an Inertia page) don't collide with the
     * Excalidraw modal sidebar's catalog fetcher.
     */
    public function jsonIndex(Request $request): JsonResponse
    {
        $stencils = CanvasStencil::query()
            ->when($request->string('category')->toString(), fn ($q, $cat) => $q->where('category', $cat))
            ->orderBy('category')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(50);

        return response()->json([
            'data' => $stencils->getCollection()->map(fn (CanvasStencil $s) => $this->serializeFull($s))->values(),
            'meta' => [
                'current_page' => $stencils->currentPage(),
                'last_page' => $stencils->lastPage(),
                'total' => $stencils->total(),
            ],
        ]);
    }

    public function show(Request $request, CanvasStencil $canvasStencil): JsonResponse
    {
        return response()->json(['stencil' => $this->serializeFull($canvasStencil)]);
    }

    public function svg(Request $request, CanvasStencil $canvasStencil): \Illuminate\Http\Response
    {
        // Resolve the path off public/ — keeps Phase-6 URL shape stable.
        $absolutePath = public_path(ltrim($canvasStencil->svg_path, '/'));
        if (! File::exists($absolutePath)) {
            return response('Not found', 404);
        }

        return response(File::get($absolutePath), 200, [
            'Content-Type' => 'image/svg+xml',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    public function store(StoreCanvasStencilRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $category = $data['category'];
        $slug = $data['slug'] ?? Str::slug($data['name']).'-'.Str::random(6);
        $data['slug'] = $slug;

        // If svg_content was sent inline, write it to public/ and store the path.
        if (! empty($data['svg_content'])) {
            $dir = public_path("stencils/{$category}");
            if (! File::isDirectory($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            $relPath = "/stencils/{$category}/{$slug}.svg";
            File::put(public_path(ltrim($relPath, '/')), $data['svg_content']);
            $data['svg_path'] = $relPath;
        }
        unset($data['svg_content']);

        $stencil = CanvasStencil::query()->create($data);

        return response()->json(['stencil' => $this->serializeFull($stencil)], 201);
    }

    public function update(UpdateCanvasStencilRequest $request, CanvasStencil $canvasStencil): JsonResponse
    {
        $canvasStencil->update($request->validated());

        return response()->json(['stencil' => $this->serializeFull($canvasStencil->refresh())]);
    }

    public function destroy(Request $request, CanvasStencil $canvasStencil): JsonResponse
    {
        $canvasStencil->delete();

        return response()->json(['deleted' => true]);
    }

    /** @return array<string, mixed> */
    private function serializeForBrowse(CanvasStencil $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'slug' => $s->slug,
            'category' => $s->category->value,
            'tags' => $s->tags ?? [],
            'svg_url' => route('admin.canvas-stencils.svg', $s),
            'requires_attribution' => $s->license->requiresAttribution(),
            'attribution' => $s->source_attribution,
        ];
    }

    /** @return array<string, mixed> */
    private function serializeFull(CanvasStencil $s): array
    {
        return [
            ...$this->serializeForBrowse($s),
            'svg_path' => $s->svg_path,
            'thumbnail_path' => $s->thumbnail_path,
            'license' => $s->license->value,
            'license_label' => $s->license->label(),
            'source_url' => $s->source_url,
            'sort_order' => $s->sort_order,
            'is_active' => $s->is_active,
            'created_by' => $s->created_by,
            'created_at' => $s->created_at?->toIso8601String(),
            'updated_at' => $s->updated_at?->toIso8601String(),
        ];
    }
}
