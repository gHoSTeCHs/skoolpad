import { AlertCircle, Check, Zap } from 'lucide-react';
import type { ProgressItem } from '@/hooks/use-generation-stream';
import type { ResolvedStageModel } from '@/types/content-studio';

interface GenerationOverlayProps {
    open: boolean;
    title: string;
    subtitle?: string;
    resolvedModel: ResolvedStageModel;
    itemsTotal: number;
    itemsDone: number;
    elapsed: string;
    items: ProgressItem[];
    blockTitleResolver: (id: string) => string;
    onCancel: () => void;
}

export function GenerationOverlay({
    open,
    title,
    subtitle,
    resolvedModel,
    itemsTotal,
    itemsDone,
    elapsed,
    items,
    blockTitleResolver,
    onCancel,
}: GenerationOverlayProps) {
    if (!open) return null;

    const sortedItems = [...items].sort((a, b) => a.startedAt - b.startedAt);
    const queuedCount = Math.max(0, itemsTotal - sortedItems.length);

    return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-b from-background/92 to-background/98 backdrop-blur-[2px]">
            <div
                className="paper-surface relative w-[460px] max-w-[calc(100%-48px)] overflow-hidden rounded-[14px] border border-border p-7"
                style={{
                    boxShadow:
                        '0 24px 48px -12px color-mix(in srgb, var(--foreground) 18%, transparent), 0 0 0 1px color-mix(in srgb, var(--honey) 10%, transparent)',
                }}
            >
                <span
                    className="gen-shimmer-bar absolute inset-x-0 top-0 h-px"
                    aria-hidden
                />

                <header className="flex items-start gap-3">
                    <div
                        className="flex h-9 w-9 flex-none items-center justify-center rounded-full border"
                        style={{
                            background: 'var(--honey-soft)',
                            borderColor: 'var(--honey-line)',
                        }}
                    >
                        <Zap
                            className="h-4 w-4"
                            style={{ color: 'var(--honey)' }}
                            strokeWidth={2}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[16px] leading-snug font-semibold tracking-tight text-foreground">
                            {title}
                        </h2>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                            {subtitle ? `${subtitle} · ` : ''}
                            <span className="tech">{resolvedModel.name}</span>
                        </p>
                    </div>
                    <div className="flex-none text-right">
                        <div className="font-display text-[20px] leading-none font-semibold tabular-nums">
                            {itemsDone} / {itemsTotal}
                        </div>
                        <div className="tech mt-1">elapsed {elapsed}</div>
                    </div>
                </header>

                <ul className="mt-5 max-h-[200px] space-y-2 overflow-y-auto pr-1">
                    {sortedItems.map((item) => (
                        <ProgressItemRow
                            key={item.id}
                            item={item}
                            resolveTitle={blockTitleResolver}
                        />
                    ))}
                    {queuedCount > 0 &&
                        Array.from({ length: queuedCount }).map((_, i) => (
                            <li
                                key={`queued-${i}`}
                                className="flex items-start gap-2.5 text-[13px] opacity-50"
                            >
                                <span className="mt-1.5 h-2 w-2 flex-none rounded-full border border-muted-foreground/40" />
                                <span className="text-muted-foreground">
                                    Queued
                                </span>
                            </li>
                        ))}
                </ul>

                <footer className="mt-6 flex items-center justify-between border-t border-border pt-5">
                    <span className="text-[11.5px] text-muted-foreground">
                        You can keep editing while this runs.
                    </span>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex h-8 items-center rounded-md px-3 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    );
}

interface ProgressItemRowProps {
    item: ProgressItem;
    resolveTitle: (id: string) => string;
}

function ProgressItemRow({ item, resolveTitle }: ProgressItemRowProps) {
    const title = resolveTitle(item.id);
    const duration =
        item.completedAt && item.startedAt
            ? Math.max(
                  1,
                  Math.round((item.completedAt - item.startedAt) / 1000),
              )
            : null;

    if (item.state === 'done') {
        return (
            <li className="flex items-start gap-2.5 text-[13px]">
                <Check
                    className="mt-0.5 h-3 w-3 flex-none"
                    style={{ color: 'var(--badge-primary-fg)' }}
                    strokeWidth={3}
                />
                <span className="flex-1 truncate text-foreground">{title}</span>
                {duration !== null && (
                    <span className="tech flex-none">{duration}s</span>
                )}
            </li>
        );
    }

    if (item.state === 'error') {
        return (
            <li className="flex items-start gap-2.5 text-[13px]">
                <AlertCircle
                    className="mt-0.5 h-3 w-3 flex-none text-destructive"
                    strokeWidth={2.5}
                />
                <span className="flex-1 truncate text-foreground">{title}</span>
                <span className="text-[11.5px] font-medium text-destructive">
                    failed
                </span>
            </li>
        );
    }

    return (
        <li className="flex items-start gap-2.5 text-[13px]">
            <span
                className="gen-pulse mt-1.5 h-2 w-2 flex-none rounded-full"
                style={{ background: 'var(--honey)' }}
                aria-hidden
            />
            <span className="flex-1 truncate font-medium text-foreground">
                {title}
            </span>
            <span
                className="text-[11.5px] font-medium"
                style={{ color: 'var(--honey)' }}
            >
                drafting…
            </span>
        </li>
    );
}
