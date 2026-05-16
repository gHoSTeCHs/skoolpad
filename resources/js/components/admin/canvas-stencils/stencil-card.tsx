import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { StencilRow } from './stencils-filter-store';

interface StencilCardProps {
    stencil: StencilRow;
    categoryLabel: string;
    onEdit: () => void;
    onDelete: () => void;
}

/**
 * Editorial specimen card — SVG dominant, mono accents below, license chip
 * top-right. Hover lifts the card and reveals the actions menu.
 */
export function StencilCard({ stencil, categoryLabel, onEdit, onDelete }: StencilCardProps) {
    return (
        <article
            data-testid={`stencil-card-${stencil.slug}`}
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all',
                'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
                !stencil.is_active && 'opacity-60',
            )}
        >
            {/* License chip — persistent visual signal */}
            <span
                className={cn(
                    'pointer-events-none absolute right-2 top-2 z-10 rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.06em]',
                    licenseChipStyles(stencil.license),
                )}
                title={stencil.license_label}
            >
                {licenseShort(stencil.license)}
            </span>

            {/* Actions menu — appears on hover or focus */}
            <DropdownMenu>
                <DropdownMenuTrigger
                    className={cn(
                        'absolute left-2 top-2 z-10 inline-flex size-7 items-center justify-center rounded-md bg-background/90 text-muted-foreground opacity-0 backdrop-blur transition-opacity',
                        'group-hover:opacity-100 focus:opacity-100 hover:text-foreground',
                    )}
                    aria-label={`Actions for ${stencil.name}`}
                    data-testid={`stencil-card-actions-${stencil.slug}`}
                >
                    <MoreVertical className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                    <DropdownMenuItem onClick={onEdit} data-testid={`stencil-card-edit-${stencil.slug}`}>
                        <Pencil className="size-3.5" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onDelete}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        data-testid={`stencil-card-delete-${stencil.slug}`}
                    >
                        <Trash2 className="size-3.5" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Specimen surface — subtle paper-grain background, generous padding */}
            <div
                className="relative flex aspect-square items-center justify-center border-b border-border/40 bg-[radial-gradient(rgba(31,26,18,0.025)_1px,transparent_1px)] [background-size:14px_14px]"
            >
                <img
                    src={stencil.svg_url}
                    alt={stencil.name}
                    className="size-3/5 max-w-full text-foreground"
                    loading="lazy"
                />
            </div>

            {/* Caption — display-font name, mono category, attribution dot */}
            <div className="flex flex-col gap-1 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 font-display text-[13px] font-medium leading-tight tracking-tight text-foreground">
                        {stencil.name}
                    </h3>
                    {stencil.requires_attribution && (
                        <span
                            className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-[var(--honey-foreground,var(--warning))]"
                            title={`Attribution: ${stencil.attribution ?? '—'}`}
                            aria-label="Attribution required"
                        />
                    )}
                </div>
                <p className="line-clamp-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                    {categoryLabel}
                </p>
            </div>
        </article>
    );
}

function licenseShort(license: string): string {
    switch (license) {
        case 'skoolpad':
            return 'sk';
        case 'cc0':
            return 'cc0';
        case 'public_domain':
            return 'pd';
        case 'cc_by_4':
            return 'cc-by';
        default:
            return license.slice(0, 3);
    }
}

function licenseChipStyles(license: string): string {
    switch (license) {
        case 'skoolpad':
            return 'bg-primary/10 text-primary';
        case 'cc0':
        case 'public_domain':
            return 'bg-muted text-muted-foreground';
        case 'cc_by_4':
            return 'bg-[var(--badge-reward-bg,var(--muted))] text-[var(--badge-reward-fg,var(--foreground))]';
        default:
            return 'bg-muted text-muted-foreground';
    }
}
