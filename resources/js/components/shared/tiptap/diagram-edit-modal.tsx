import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { DiagramKind, DiagramOwner } from './diagram-node';
import {
    useActiveCategoryChips,
    useFilteredStencils,
    useRecentStencils,
    useStencilStore,
    type StencilCatalogEntry,
} from './stencil-store';

/**
 * Excalidraw is ~600 KB. Loaded lazily so it doesn't bundle into pages that
 * never open the modal (most student-facing pages).
 */
let excalidrawModulePromise: Promise<typeof import('@excalidraw/excalidraw')> | null = null;
function loadExcalidraw() {
    if (!excalidrawModulePromise) {
        excalidrawModulePromise = (async () => {
            const [mod] = await Promise.all([
                import('@excalidraw/excalidraw'),
                import('@excalidraw/excalidraw/index.css'),
            ]);
            return mod;
        })();
    }
    return excalidrawModulePromise;
}

const ExcalidrawLazy = lazy(async () => {
    const mod = await loadExcalidraw();
    return { default: mod.Excalidraw };
});

interface DiagramEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    owner: DiagramOwner | null;
    assetId: string | null | undefined;
    kind: DiagramKind;
    caption: string;
    altText: string;
    onSaved: (assetId: string) => void;
}

interface AssetResponse {
    asset: {
        id: string;
        excalidraw_json: Record<string, unknown> | null;
        svg_payload: string | null;
        alt_text: string | null;
        caption: string | null;
    };
}

type ExcalidrawApi = {
    getSceneElements: () => readonly unknown[];
    getAppState: () => Record<string, unknown> & {
        scrollX: number;
        scrollY: number;
        zoom: { value: number };
        width: number;
        height: number;
    };
    getFiles: () => Record<string, unknown>;
    addFiles: (files: { id: string; dataURL: string; mimeType: string; created: number }[]) => void;
    updateScene: (scene: { elements?: readonly unknown[] }) => void;
};

export function DiagramEditModal({
    open,
    onOpenChange,
    owner,
    assetId,
    kind,
    caption,
    altText,
    onSaved,
}: DiagramEditModalProps) {
    'use no memo';
    const apiRef = useRef<ExcalidrawApi | null>(null);

    // Instance-scoped: dies with the modal
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialJson, setInitialJson] = useState<Record<string, unknown> | null>(null);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [insertingSlug, setInsertingSlug] = useState<string | null>(null);

    // Shared, cached: zustand (CP11.5)
    const catalogStatus = useStencilStore((s) => s.status);
    const loadCatalog = useStencilStore((s) => s.load);
    const activeCategory = useStencilStore((s) => s.activeCategory);
    const setActiveCategory = useStencilStore((s) => s.setActiveCategory);
    const searchQuery = useStencilStore((s) => s.searchQuery);
    const setSearchQuery = useStencilStore((s) => s.setSearchQuery);
    const markStencilUsed = useStencilStore((s) => s.markStencilUsed);
    const clearRecent = useStencilStore((s) => s.clearRecent);
    const filteredStencils = useFilteredStencils();
    const categoryChips = useActiveCategoryChips();
    const recentStencils = useRecentStencils();
    // Hide the Recent section when the user is actively filtering — the main grid
    // is already narrowed, redundant "recent" rows would just clutter.
    const showRecent =
        recentStencils.length > 0 && activeCategory === 'all' && searchQuery.trim() === '';

    useEffect(() => {
        if (!open) {
            apiRef.current = null;
            setError(null);
            setInitialJson(null);
            return;
        }
        // Idempotent — store handles dedup if already loading/ready
        void loadCatalog();
        if (!assetId) {
            setInitialJson(null);
            return;
        }
        let cancelled = false;
        setLoadingExisting(true);
        (async () => {
            try {
                const res = await fetch(`/admin/assets/${assetId}`, {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) throw new Error(`Asset fetch failed (${res.status})`);
                const body: AssetResponse = await res.json();
                if (!cancelled) setInitialJson(body.asset.excalidraw_json ?? null);
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Failed to load existing diagram');
                }
            } finally {
                if (!cancelled) setLoadingExisting(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, assetId, loadCatalog]);

    const insertStencil = useCallback(async (stencil: StencilCatalogEntry) => {
        const api = apiRef.current;
        if (!api) return;
        setInsertingSlug(stencil.slug);
        try {
            const svgRes = await fetch(stencil.svg_url, { credentials: 'same-origin' });
            if (!svgRes.ok) throw new Error(`Stencil fetch failed (${svgRes.status})`);
            const svgText = await svgRes.text();

            const fileId = `stencil-${stencil.slug}-${Date.now()}`;
            // Excalidraw's addFiles decodes data URLs as base64 — utf8/URI-encoded
            // form throws InvalidCharacterError. Use a unicode-safe base64 encoder
            // so future stencils with Greek letters / symbols still work.
            const bytes = new TextEncoder().encode(svgText);
            let binary = '';
            for (const b of bytes) binary += String.fromCharCode(b);
            const dataURL = `data:image/svg+xml;base64,${btoa(binary)}`;

            api.addFiles([
                { id: fileId, dataURL, mimeType: 'image/svg+xml', created: Date.now() },
            ]);

            const st = api.getAppState();
            const zoom = st.zoom?.value ?? 1;
            const width = 160;
            const height = 160;
            const sceneCenterX = -st.scrollX + st.width / 2 / zoom;
            const sceneCenterY = -st.scrollY + st.height / 2 / zoom;

            const mod = await loadExcalidraw();
            const skeleton = [
                {
                    type: 'image',
                    fileId,
                    x: sceneCenterX - width / 2,
                    y: sceneCenterY - height / 2,
                    width,
                    height,
                    status: 'saved',
                },
            ];
            const newElements = mod.convertToExcalidrawElements(skeleton as never);

            const current = api.getSceneElements();
            api.updateScene({ elements: [...current, ...newElements] });

            // Track this insertion so it floats to the top of the sidebar next time.
            markStencilUsed(stencil.slug);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to insert stencil');
        } finally {
            setInsertingSlug(null);
        }
    }, [markStencilUsed]);

    const handleSave = useCallback(async () => {
        if (!owner && !assetId) {
            setError(
                'No owner scope set for this editor. Surfaces must set `editor.storage.diagram.owner` before saving.',
            );
            return;
        }
        const api = apiRef.current;
        if (!api) {
            setError('Excalidraw API not ready.');
            return;
        }

        const elements = api.getSceneElements();
        const appState = api.getAppState();
        const files = api.getFiles();

        let svgString = '';
        try {
            const mod = await loadExcalidraw();
            const svg = await mod.exportToSvg({
                elements: elements as never,
                appState: { ...appState, exportBackground: false } as never,
                files: files as never,
                exportPadding: 12,
            });
            svgString = new XMLSerializer().serializeToString(svg);
        } catch (e) {
            console.warn('SVG export failed; saving without payload', e);
        }

        const xsrf = decodeURIComponent(
            document.cookie
                .split('; ')
                .find((c) => c.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] ?? '',
        );

        const isUpdate = !!assetId;
        const url = isUpdate ? `/admin/assets/${assetId}` : '/admin/assets';
        const method = isUpdate ? 'PUT' : 'POST';

        const payload: Record<string, unknown> = {
            kind: 'diagram_excalidraw',
            excalidraw_json: { type: 'excalidraw', version: 2, elements, appState, files },
            svg_payload: svgString,
            alt_text: altText || null,
            caption: caption || null,
        };
        if (!isUpdate && owner) {
            payload[`${owner.kind}_id`] = owner.id;
        }

        setSaving(true);
        setError(null);
        try {
            const res = await fetch(url, {
                method,
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': xsrf,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const body: { message?: string } = await res.json().catch(() => ({}));
                throw new Error(body?.message || `Save failed (${res.status})`);
            }
            const json: AssetResponse = await res.json();
            onSaved(json.asset.id);
            onOpenChange(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    }, [owner, assetId, altText, caption, onSaved, onOpenChange]);

    const catalogReady = catalogStatus === 'ready';
    const catalogLoading = catalogStatus === 'loading' || catalogStatus === 'idle';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[96vw] sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-[20px] tracking-tight">
                        {assetId ? 'Edit diagram' : 'Draw diagram'}
                    </DialogTitle>
                    <DialogDescription>
                        Sketch the figure below — or pick a stencil from the sidebar. Saved diagrams are editable later.
                        {kind !== 'free_form' && (
                            <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
                                kind: {kind}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-3" style={{ height: '60vh', minHeight: 400 }}>
                    {/* ── Stencil sidebar (CP11.5) ─────────────────────────── */}
                    <aside
                        className="flex w-[224px] shrink-0 flex-col gap-2.5 rounded-lg border border-border bg-card/40 p-2.5"
                        data-testid="stencil-sidebar"
                    >
                        <header className="flex items-baseline justify-between px-0.5">
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                Stencils
                            </span>
                            {catalogReady && (
                                <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                                    {filteredStencils.length}
                                </span>
                            )}
                        </header>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search stencils…"
                                className="h-8 border-border/60 pl-8 text-[12px] placeholder:text-muted-foreground/50"
                                data-testid="stencil-search"
                            />
                        </div>

                        {/* Category chips — only categories with stencils */}
                        {catalogReady && categoryChips.length > 0 && (
                            <div
                                className="-mx-0.5 flex flex-wrap gap-1 px-0.5"
                                data-testid="stencil-categories"
                            >
                                <CategoryChip
                                    label="All"
                                    active={activeCategory === 'all'}
                                    onClick={() => setActiveCategory('all')}
                                />
                                {categoryChips.map((c) => (
                                    <CategoryChip
                                        key={c.value}
                                        label={shortCategoryLabel(c.label)}
                                        title={c.label}
                                        active={activeCategory === c.value}
                                        onClick={() => setActiveCategory(c.value)}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5" data-testid="stencil-grid">
                            {showRecent && (
                                <section className="mb-3" data-testid="stencil-recent">
                                    <header className="mb-1.5 flex items-center justify-between px-0.5">
                                        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                                            Recent
                                            <span className="ml-1.5 opacity-60">{recentStencils.length}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearRecent}
                                            className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground/60 transition-colors hover:text-foreground"
                                            data-testid="stencil-recent-clear"
                                            title="Clear recent stencils"
                                        >
                                            clear
                                        </button>
                                    </header>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {recentStencils.map((s) => (
                                            <StencilThumb
                                                key={`recent-${s.id}`}
                                                stencil={s}
                                                busy={insertingSlug === s.slug}
                                                onClick={() => insertStencil(s)}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-3 border-t border-dashed border-border" />
                                </section>
                            )}
                            {catalogLoading ? (
                                <StencilSkeleton />
                            ) : !catalogReady ? (
                                <div className="px-2 py-3 text-center text-[11px] italic text-muted-foreground">
                                    Couldn&rsquo;t load stencils.
                                </div>
                            ) : filteredStencils.length === 0 ? (
                                <div className="px-2 py-6 text-center text-[11px] italic text-muted-foreground">
                                    Nothing matches{searchQuery ? ` “${searchQuery}”` : ''}.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-1.5">
                                    {filteredStencils.map((s) => (
                                        <StencilThumb
                                            key={s.id}
                                            stencil={s}
                                            busy={insertingSlug === s.slug}
                                            onClick={() => insertStencil(s)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* ── Drawing canvas ────────────────────────────────────── */}
                    <div
                        className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-muted/30"
                        data-testid="diagram-canvas"
                    >
                        {loadingExisting ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Loading existing diagram…
                            </div>
                        ) : open ? (
                            <Suspense
                                fallback={
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        Loading drawing canvas…
                                    </div>
                                }
                            >
                                <ExcalidrawLazy
                                    excalidrawAPI={((api: unknown) => {
                                        apiRef.current = api as ExcalidrawApi;
                                    }) as React.ComponentProps<typeof ExcalidrawLazy>['excalidrawAPI']}
                                    initialData={initialJson ?? undefined}
                                />
                            </Suspense>
                        ) : null}
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-destructive" data-testid="diagram-error">
                        {error}
                    </p>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loadingExisting}
                        data-testid="diagram-save"
                    >
                        {saving ? 'Saving…' : 'Save diagram'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface CategoryChipProps {
    label: string;
    title?: string;
    active: boolean;
    onClick: () => void;
}

function CategoryChip({ label, title, active, onClick }: CategoryChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            data-active={active || undefined}
            className={cn(
                'rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] transition-colors',
                active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground',
            )}
        >
            {label}
        </button>
    );
}

interface StencilThumbProps {
    stencil: StencilCatalogEntry;
    busy: boolean;
    onClick: () => void;
}

function StencilThumb({ stencil, busy, onClick }: StencilThumbProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={busy}
            title={
                stencil.requires_attribution && stencil.attribution
                    ? `${stencil.name} · attribution: ${stencil.attribution}`
                    : stencil.name
            }
            data-testid={`stencil-${stencil.slug}`}
            className={cn(
                'group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-border/60 bg-background/80 p-1 text-foreground transition-all',
                'hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/[0.04] hover:shadow-sm',
                busy && 'animate-pulse opacity-60',
            )}
        >
            <img
                src={stencil.svg_url}
                alt=""
                aria-hidden
                className="size-10 opacity-75 transition-opacity group-hover:opacity-100"
                loading="lazy"
            />
            <span className="line-clamp-1 px-1 text-[9px] leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                {stencil.name}
            </span>
            {stencil.requires_attribution && (
                <span
                    className="absolute right-1 top-1 size-1 rounded-full bg-honey-foreground/60"
                    title="Attribution required"
                    aria-hidden
                />
            )}
        </button>
    );
}

function StencilSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="aspect-square animate-pulse rounded-md border border-border/40 bg-muted/40"
                    style={{ animationDelay: `${i * 60}ms` }}
                />
            ))}
        </div>
    );
}

/**
 * "Physics — Circuits" → "Circuits". The chip is sub-150px; the long form
 * lives in the title attribute on hover so context isn't lost.
 */
function shortCategoryLabel(label: string): string {
    const dashIdx = label.indexOf('—');
    if (dashIdx >= 0) return label.slice(dashIdx + 1).trim();
    return label;
}
