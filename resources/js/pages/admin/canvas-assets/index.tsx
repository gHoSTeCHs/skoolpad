import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ExternalLink, Search, Shapes, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import CanvasStencilController from '@/actions/App/Http/Controllers/Admin/CanvasStencilController';
import ContentBlockAssetController from '@/actions/App/Http/Controllers/Admin/ContentBlockAssetController';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import {
    useAssetsFilterStore,
    useFilteredAssetRows,
    type AltFilter,
    type AssetRow,
    type ScopeFilter,
} from '@/components/admin/canvas-assets/assets-filter-store';

interface Props {
    assets: AssetRow[];
}

const breadcrumbs = [{ title: 'Canvas Assets', href: '/admin/canvas-assets' }];

const SCOPE_OPTIONS: { value: ScopeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'content_block', label: 'Block' },
    { value: 'question', label: 'Question' },
    { value: 'question_paper', label: 'Paper' },
];

const ALT_OPTIONS: { value: AltFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'missing', label: 'Missing alt-text' },
    { value: 'present', label: 'Has alt-text' },
];

export default function AdminCanvasAssets({ assets }: Props) {
    'use no memo';
    const search = useAssetsFilterStore((s) => s.search);
    const setSearch = useAssetsFilterStore((s) => s.setSearch);
    const scope = useAssetsFilterStore((s) => s.scope);
    const setScope = useAssetsFilterStore((s) => s.setScope);
    const altFilter = useAssetsFilterStore((s) => s.altFilter);
    const setAltFilter = useAssetsFilterStore((s) => s.setAltFilter);
    const reset = useAssetsFilterStore((s) => s.reset);

    const filtered = useFilteredAssetRows(assets);

    const stats = useMemo(() => {
        const total = assets.length;
        const missingAlt = assets.filter((a) => !a.has_alt_text).length;
        const orphan = assets.filter((a) => !a.owner_url).length;
        return { total, missingAlt, orphan };
    }, [assets]);

    const [deleting, setDeleting] = useState<AssetRow | null>(null);
    const hasAnyFilter = search !== '' || scope !== 'all' || altFilter !== 'all';

    function handleDelete() {
        if (!deleting) return;
        router.delete(
            ContentBlockAssetController.adminDestroy.url({ asset: deleting.id }),
            {
                preserveScroll: true,
                onFinish: () => setDeleting(null),
            },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Canvas Assets" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* ─── Header + stats row ─────────────────────────────────── */}
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            Canvas library
                        </p>
                        <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight tracking-tight text-foreground">
                            Asset ledger
                        </h1>
                        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                            Every diagram authors have drawn — across content blocks, questions, answers,
                            and shared paper contexts. Surface missing alt-text and orphan assets here.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <StatChip label="Total" value={stats.total} />
                        <StatChip
                            label="Missing alt"
                            value={stats.missingAlt}
                            tone={stats.missingAlt > 0 ? 'warning' : 'neutral'}
                            onClick={
                                stats.missingAlt > 0
                                    ? () => {
                                          setAltFilter('missing');
                                          setScope('all');
                                          setSearch('');
                                      }
                                    : undefined
                            }
                        />
                        <StatChip label="Orphan" value={stats.orphan} />
                    </div>
                </header>

                {/* ─── Filter bar ─────────────────────────────────────────── */}
                <section className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[260px] max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by alt-text, caption, or owner…"
                                className="pl-9"
                                data-testid="canvas-assets-search"
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
                            Scope
                        </span>
                        {SCOPE_OPTIONS.map((o) => (
                            <FilterChip
                                key={o.value}
                                label={o.label}
                                active={scope === o.value}
                                onClick={() => setScope(o.value)}
                            />
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                            Alt-text
                        </span>
                        {ALT_OPTIONS.map((o) => (
                            <FilterChip
                                key={o.value}
                                label={o.label}
                                active={altFilter === o.value}
                                onClick={() => setAltFilter(o.value)}
                            />
                        ))}
                    </div>
                </section>

                {/* ─── Ledger ─────────────────────────────────────────────── */}
                {filtered.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center"
                        data-testid="canvas-assets-empty"
                    >
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Shapes className="size-5" />
                        </div>
                        <h3 className="font-display text-base font-medium text-foreground">
                            {assets.length === 0 ? 'No assets yet' : 'Nothing matches'}
                        </h3>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            {assets.length === 0
                                ? 'Drawn diagrams appear here as soon as authors save them.'
                                : 'Try clearing the filters or adjusting your search.'}
                        </p>
                    </div>
                ) : (
                    <div
                        className="overflow-hidden rounded-xl border border-border bg-card"
                        data-testid="canvas-assets-ledger"
                    >
                        <div className="grid grid-cols-[48px_1fr_84px_56px_140px_120px_56px] gap-3 border-b border-border bg-muted/40 px-3 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                            <span></span>
                            <span>Asset</span>
                            <span>Scope</span>
                            <span className="text-center">A11y</span>
                            <span>Owner</span>
                            <span>Updated</span>
                            <span className="text-right">Act</span>
                        </div>
                        <ul className="divide-y divide-border">
                            {filtered.map((a) => (
                                <AssetRowItem
                                    key={a.id}
                                    asset={a}
                                    onDelete={() => setDeleting(a)}
                                />
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">
                            Delete this asset?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            The cached SVG is removed and the Tiptap node that references it will
                            render as an empty placeholder. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="canvas-assets-delete-confirm"
                        >
                            Delete asset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* tip when nothing matches: link to stencils */}
            {assets.length === 0 && (
                <div className="px-4 pb-6 text-center md:px-6">
                    <Link
                        href={CanvasStencilController.index.url()}
                        className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
                    >
                        Manage the stencil library →
                    </Link>
                </div>
            )}
        </AdminLayout>
    );
}

interface StatChipProps {
    label: string;
    value: number;
    tone?: 'neutral' | 'warning';
    onClick?: () => void;
}

function StatChip({ label, value, tone = 'neutral', onClick }: StatChipProps) {
    const interactive = !!onClick;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!interactive}
            className={cn(
                'flex flex-col items-end gap-0.5 rounded-md border px-3 py-1.5 transition-colors',
                tone === 'warning'
                    ? 'border-[var(--warning)]/40 bg-[var(--warning)]/8 text-[var(--warning)]'
                    : 'border-border bg-card text-foreground',
                interactive && 'cursor-pointer hover:border-foreground/40',
                !interactive && 'cursor-default',
            )}
            title={interactive ? 'Filter to these' : undefined}
        >
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-80">
                {label}
            </span>
            <span className="font-display text-[18px] font-semibold leading-none tabular-nums">
                {value}
            </span>
        </button>
    );
}

interface AssetRowItemProps {
    asset: AssetRow;
    onDelete: () => void;
}

function AssetRowItem({ asset, onDelete }: AssetRowItemProps) {
    const updated = asset.updated_at
        ? new Date(asset.updated_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : '—';

    return (
        <li
            className="grid grid-cols-[48px_1fr_84px_56px_140px_120px_56px] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30"
            data-testid={`canvas-asset-row-${asset.id}`}
        >
            {/* Thumbnail */}
            <div className="flex size-10 items-center justify-center rounded-md border border-border/60 bg-background bg-[radial-gradient(rgba(31,26,18,0.025)_1px,transparent_1px)] [background-size:8px_8px]">
                {asset.has_svg ? (
                    <img
                        src={asset.svg_url}
                        alt=""
                        aria-hidden
                        className="size-7"
                        loading="lazy"
                    />
                ) : (
                    <Shapes className="size-4 text-muted-foreground/50" />
                )}
            </div>

            {/* Name / caption */}
            <div className="min-w-0">
                <p
                    className={cn(
                        'line-clamp-1 text-[13px]',
                        asset.alt_text ? 'text-foreground' : 'italic text-muted-foreground',
                    )}
                >
                    {asset.alt_text || asset.caption || 'Untitled asset'}
                </p>
                {asset.caption && asset.caption !== asset.alt_text && (
                    <p className="line-clamp-1 font-mono text-[10px] text-muted-foreground">
                        {asset.caption}
                    </p>
                )}
            </div>

            {/* Scope */}
            <span
                className={cn(
                    'inline-flex w-fit items-center rounded px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.04em]',
                    scopeChipStyles(asset.scope),
                )}
            >
                {scopeShort(asset.scope)}
            </span>

            {/* Alt-text status */}
            <span className="flex justify-center">
                {asset.has_alt_text ? (
                    <span
                        className="size-1.5 rounded-full bg-[var(--success)]"
                        title="alt-text present"
                        aria-label="alt-text present"
                    />
                ) : (
                    <span
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--warning)]/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.04em] text-[var(--warning)]"
                        title="alt-text missing — required to publish"
                    >
                        <AlertCircle className="size-2.5" />
                        none
                    </span>
                )}
            </span>

            {/* Owner */}
            <div className="min-w-0 text-[12px]">
                {asset.owner_url ? (
                    <Link
                        href={asset.owner_url}
                        className="group inline-flex max-w-full items-center gap-1 text-foreground hover:text-primary"
                    >
                        <span className="line-clamp-1">{asset.owner_label}</span>
                        <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                ) : (
                    <span className="italic text-muted-foreground">{asset.owner_label}</span>
                )}
            </div>

            {/* Updated */}
            <span className="font-mono text-[10.5px] text-muted-foreground">{updated}</span>

            {/* Actions */}
            <div className="flex items-center justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="size-7 p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    title="Delete asset"
                    data-testid={`canvas-asset-delete-${asset.id}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        </li>
    );
}

interface FilterChipProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            data-active={active || undefined}
            className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.04em] transition-colors',
                active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground',
            )}
        >
            {label}
        </button>
    );
}

function scopeShort(scope: AssetRow['scope']): string {
    switch (scope) {
        case 'content_block': return 'block';
        case 'question': return 'question';
        case 'question_paper': return 'paper';
    }
}

function scopeChipStyles(scope: AssetRow['scope']): string {
    switch (scope) {
        case 'content_block': return 'bg-primary/10 text-primary';
        case 'question': return 'bg-muted text-foreground';
        case 'question_paper': return 'bg-[var(--honey)]/10 text-[var(--honey,var(--warning))]';
    }
}
