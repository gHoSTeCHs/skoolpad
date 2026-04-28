import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { GenerationLogEntry } from '@/types/content-studio';

interface LogDrawerProps {
    open: boolean;
    onOpenChange: (next: boolean) => void;
    logs: GenerationLogEntry[];
    blockTitleResolver?: (blockId: string) => string | null;
    topicTitleResolver?: (topicId: string) => string | null;
}

const PROMPT_TYPE_TONE: Record<string, string> = {
    research: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    scheme: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    structure: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    blocks: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    content: 'bg-[var(--honey-soft)] text-[color:var(--honey)]',
    questions: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
    explanations: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
};

function formatCost(cents: number | null): string {
    if (cents === null || cents === 0) return '—';
    if (cents < 1) return '<$0.01';
    return `$${(cents / 100).toFixed(2)}`;
}

function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return 'just now';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}

export function LogDrawer({
    open,
    onOpenChange,
    logs,
    blockTitleResolver,
    topicTitleResolver,
}: LogDrawerProps) {
    const promptTypes = useMemo(() => {
        const set = new Set<string>();
        for (const l of logs) set.add(l.prompt_type);
        return [...set].sort();
    }, [logs]);

    const [filter, setFilter] = useState<string | null>(null);

    const filtered = useMemo(
        () => (filter ? logs.filter((l) => l.prompt_type === filter) : logs),
        [logs, filter],
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[480px] sm:max-w-[480px]">
                <SheetHeader className="px-6 pt-6 pb-3">
                    <SheetTitle className="flex items-center gap-2.5 font-display text-[16px] tracking-tight">
                        Generation log
                        <span className="tech text-muted-foreground">
                            {logs.length}
                        </span>
                    </SheetTitle>
                    <SheetDescription className="text-[12.5px]">
                        {logs.length === 0
                            ? 'No generations yet for this project.'
                            : `Most recent ${logs.length} generation calls.`}
                    </SheetDescription>

                    {promptTypes.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <FilterChip
                                label="All"
                                active={filter === null}
                                onClick={() => setFilter(null)}
                            />
                            {promptTypes.map((t) => (
                                <FilterChip
                                    key={t}
                                    label={t}
                                    active={filter === t}
                                    onClick={() => setFilter(t)}
                                />
                            ))}
                        </div>
                    )}
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                    {filtered.length === 0 ? (
                        <p className="py-8 text-center text-[13px] text-muted-foreground">
                            {logs.length === 0
                                ? 'No generations yet.'
                                : 'No entries match this filter.'}
                        </p>
                    ) : (
                        <ol className="space-y-2.5">
                            {filtered.map((log) => (
                                <LogRow
                                    key={log.id}
                                    log={log}
                                    blockTitle={
                                        log.content_block_id &&
                                        blockTitleResolver
                                            ? blockTitleResolver(
                                                  log.content_block_id,
                                              )
                                            : null
                                    }
                                    topicTitle={
                                        log.canonical_topic_id &&
                                        topicTitleResolver
                                            ? topicTitleResolver(
                                                  log.canonical_topic_id,
                                              )
                                            : null
                                    }
                                />
                            ))}
                        </ol>
                    )}
                </div>
            </SheetContent>
        </Sheet>
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
            className={cn(
                'inline-flex h-6 items-center rounded-full px-2.5 text-[10.5px] font-medium tracking-wide uppercase transition-colors',
                active
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
        >
            {label}
        </button>
    );
}

interface LogRowProps {
    log: GenerationLogEntry;
    blockTitle: string | null;
    topicTitle: string | null;
}

function LogRow({ log, blockTitle, topicTitle }: LogRowProps) {
    const tone =
        PROMPT_TYPE_TONE[log.prompt_type] ?? PROMPT_TYPE_TONE.explanations;

    return (
        <li className="rounded-md border border-border bg-card px-3 py-2.5">
            <div className="flex items-center gap-2">
                <span
                    className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase',
                        tone,
                    )}
                >
                    {log.prompt_type}
                </span>
                <span className="tech min-w-0 flex-1 truncate text-foreground">
                    {log.model_used || '—'}
                </span>
                {log.is_valid ? (
                    <Check
                        className="h-3 w-3 flex-none"
                        style={{ color: 'var(--badge-primary-fg)' }}
                        strokeWidth={3}
                    />
                ) : (
                    <X
                        className="h-3 w-3 flex-none text-destructive"
                        strokeWidth={2.5}
                    />
                )}
            </div>

            {(blockTitle || topicTitle) && (
                <div className="mt-1.5 truncate text-[12px] text-muted-foreground">
                    <span className="text-muted-foreground/70">→ </span>
                    {blockTitle ?? <>Topic · {topicTitle}</>}
                </div>
            )}

            <div className="mt-1.5 flex items-center justify-between gap-3 text-[11.5px] text-muted-foreground">
                <span className="flex items-center gap-3">
                    <span className="tech">
                        {log.tokens_used.toLocaleString()} tokens
                    </span>
                    <span className="tech">
                        {formatCost(log.estimated_cost_cents)}
                    </span>
                </span>
                <span className="tech">{relativeTime(log.created_at)}</span>
            </div>
        </li>
    );
}
