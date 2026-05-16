import { Head } from '@inertiajs/react';
import { Plus, Search, Shapes, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { StencilCard } from '@/components/admin/canvas-stencils/stencil-card';
import { StencilDeleteDialog } from '@/components/admin/canvas-stencils/stencil-delete-dialog';
import {
    StencilFormDialog,
    type CategoryOption,
    type LicenseOption,
} from '@/components/admin/canvas-stencils/stencil-form-dialog';
import {
    useFilteredStencilRows,
    useStencilsFilterStore,
    type StencilRow,
} from '@/components/admin/canvas-stencils/stencils-filter-store';

interface Props {
    stencils: StencilRow[];
    categories: CategoryOption[];
    licenses: LicenseOption[];
}

const breadcrumbs = [{ title: 'Canvas Stencils', href: '/admin/canvas-stencils' }];

export default function AdminCanvasStencils({ stencils, categories, licenses }: Props) {
    'use no memo';
    const search = useStencilsFilterStore((s) => s.search);
    const setSearch = useStencilsFilterStore((s) => s.setSearch);
    const activeCategory = useStencilsFilterStore((s) => s.activeCategory);
    const setActiveCategory = useStencilsFilterStore((s) => s.setActiveCategory);
    const activeLicense = useStencilsFilterStore((s) => s.activeLicense);
    const setActiveLicense = useStencilsFilterStore((s) => s.setActiveLicense);
    const reset = useStencilsFilterStore((s) => s.reset);

    const filtered = useFilteredStencilRows(stencils);

    // Only show category chips for categories that have at least one stencil.
    const activeCategoryChips = useMemo(() => {
        const used = new Set(stencils.map((s) => s.category));
        return categories.filter((c) => used.has(c.value));
    }, [categories, stencils]);

    const categoryLabel = useMemo(
        () => Object.fromEntries(categories.map((c) => [c.value, c.label])),
        [categories],
    );

    // Per-category counts for the chip hover hints
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const s of stencils) counts[s.category] = (counts[s.category] ?? 0) + 1;
        return counts;
    }, [stencils]);

    const licenseCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const s of stencils) counts[s.license] = (counts[s.license] ?? 0) + 1;
        return counts;
    }, [stencils]);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<StencilRow | null>(null);
    const [deleting, setDeleting] = useState<StencilRow | null>(null);

    function openUpload() {
        setEditing(null);
        setFormOpen(true);
    }
    function openEdit(stencil: StencilRow) {
        setEditing(stencil);
        setFormOpen(true);
    }

    const hasAnyFilter = search !== '' || activeCategory !== 'all' || activeLicense !== 'all';

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Canvas Stencils" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* ─── Header ─────────────────────────────────────────────── */}
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            Canvas library
                        </p>
                        <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight tracking-tight text-foreground">
                            Stencils
                        </h1>
                        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                            STEM symbols authors can drop onto Excalidraw canvases. Each specimen carries
                            its license and provenance — admin uploads must respect the
                            <span className="ml-1 font-mono text-[11px]">no CC-BY-SA</span> sourcing policy.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                            {stencils.length} total
                        </span>
                        <Button onClick={openUpload} data-testid="stencils-upload-btn">
                            <Plus className="size-4" />
                            Upload stencil
                        </Button>
                    </div>
                </header>

                {/* ─── Filter bar ─────────────────────────────────────────── */}
                <section className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[220px] max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, slug, or tag…"
                                className="pl-9"
                                data-testid="stencils-search"
                            />
                        </div>
                        {hasAnyFilter && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => reset()}
                                className="text-muted-foreground"
                            >
                                <X className="size-3.5" />
                                Reset filters
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                            Category
                        </span>
                        <FilterChip
                            label="All"
                            active={activeCategory === 'all'}
                            onClick={() => setActiveCategory('all')}
                        />
                        {activeCategoryChips.map((c) => (
                            <FilterChip
                                key={c.value}
                                label={shortCategoryLabel(c.label)}
                                title={`${c.label} · ${categoryCounts[c.value] ?? 0}`}
                                active={activeCategory === c.value}
                                count={categoryCounts[c.value]}
                                onClick={() => setActiveCategory(c.value)}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                            License
                        </span>
                        <FilterChip
                            label="All"
                            active={activeLicense === 'all'}
                            onClick={() => setActiveLicense('all')}
                        />
                        {licenses.map((l) => (
                            <FilterChip
                                key={l.value}
                                label={l.label.replace(/\s*\(.*\)$/, '')}
                                title={l.label}
                                active={activeLicense === l.value}
                                count={licenseCounts[l.value]}
                                onClick={() => setActiveLicense(l.value)}
                            />
                        ))}
                    </div>
                </section>

                {/* ─── Grid ───────────────────────────────────────────────── */}
                {filtered.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center"
                        data-testid="stencils-empty"
                    >
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Shapes className="size-5" />
                        </div>
                        <h3 className="font-display text-base font-medium text-foreground">
                            {stencils.length === 0 ? 'No stencils yet' : 'Nothing matches'}
                        </h3>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            {stencils.length === 0
                                ? 'Upload your first SVG to start the library.'
                                : hasAnyFilter
                                  ? 'Try clearing the filters or adjusting your search.'
                                  : 'No active stencils to display.'}
                        </p>
                        {stencils.length === 0 && (
                            <Button onClick={openUpload} className="mt-2">
                                <Plus className="size-4" />
                                Upload first stencil
                            </Button>
                        )}
                    </div>
                ) : (
                    <div
                        className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        data-testid="stencils-grid"
                    >
                        {filtered.map((s) => (
                            <StencilCard
                                key={s.id}
                                stencil={s}
                                categoryLabel={categoryLabel[s.category] ?? s.category}
                                onEdit={() => openEdit(s)}
                                onDelete={() => setDeleting(s)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <StencilFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                stencil={editing}
                categories={categories}
                licenses={licenses}
            />
            <StencilDeleteDialog
                stencil={deleting}
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
            />
        </AdminLayout>
    );
}

interface FilterChipProps {
    label: string;
    title?: string;
    active: boolean;
    count?: number;
    onClick: () => void;
}

function FilterChip({ label, title, active, count, onClick }: FilterChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            data-active={active || undefined}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.04em] transition-colors',
                active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground',
            )}
        >
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className="tabular-nums opacity-60">{count}</span>
            )}
        </button>
    );
}

/** "Physics — Circuits" → "Circuits". Long form lives in title on hover. */
function shortCategoryLabel(label: string): string {
    const idx = label.indexOf('—');
    if (idx >= 0) return label.slice(idx + 1).trim();
    return label;
}
