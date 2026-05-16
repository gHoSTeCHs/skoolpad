import { Fragment, useMemo, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { GenerationLogEntry } from '@/types/content-studio';

interface LogDrawerProps {
    open: boolean;
    onOpenChange: (next: boolean) => void;
    logs: GenerationLogEntry[];
    blockTitleResolver?: (blockId: string) => string | null;
    topicTitleResolver?: (topicId: string) => string | null;
}

const STAGE_TONE: Record<string, string> = {
    research: 'var(--badge-primary-fg)',
    scheme: 'var(--badge-reward-fg)',
    structure: 'var(--badge-reward-fg)',
    blocks: 'var(--badge-reward-fg)',
    content: 'var(--honey)',
    questions: 'var(--badge-danger-fg)',
    explanations: 'var(--muted-foreground)',
};

function formatCost(cents: number | null): string {
    if (cents === null || cents === 0) return '—';
    if (cents < 1) return '<$0.01';
    if (cents < 100) return `${cents}¢`;
    return `$${(cents / 100).toFixed(2)}`;
}

function formatRelTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return 'now';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d}d`;
    return new Date(iso).toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
    });
}

export function LogDrawer({
    open,
    onOpenChange,
    logs,
    blockTitleResolver,
    topicTitleResolver,
}: LogDrawerProps) {
    const [filter, setFilter] = useState<string | null>(null);

    const promptTypes = useMemo(() => {
        const set = new Set<string>();
        for (const l of logs) set.add(l.prompt_type);
        return [...set].sort();
    }, [logs]);

    const filtered = useMemo(
        () => (filter ? logs.filter((l) => l.prompt_type === filter) : logs),
        [logs, filter],
    );

    const totals = useMemo(
        () => ({
            tokens: logs.reduce((s, l) => s + l.tokens_used, 0),
            cents: logs.reduce((s, l) => s + (l.estimated_cost_cents ?? 0), 0),
            calls: logs.length,
        }),
        [logs],
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-[480px] flex-col gap-0 p-0 sm:max-w-[480px]"
            >
                <header className="flex-none border-b border-border px-6 pt-6 pb-5">
                    <h2 className="font-display text-[18px] font-semibold tracking-tight text-foreground">
                        Generation log
                    </h2>

                    <dl className="mt-6 grid grid-cols-3 gap-3">
                        <Stat
                            label="Tokens"
                            value={totals.tokens.toLocaleString()}
                        />
                        <Stat label="Cost" value={formatCost(totals.cents)} />
                        <Stat label="Calls" value={String(totals.calls)} />
                    </dl>

                    {promptTypes.length > 1 && (
                        <nav
                            aria-label="Filter by stage"
                            className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px]"
                        >
                            <FilterLink
                                label="All"
                                active={filter === null}
                                onClick={() => setFilter(null)}
                            />
                            {promptTypes.map((t) => (
                                <Fragment key={t}>
                                    <span
                                        className="text-muted-foreground/40"
                                        aria-hidden
                                    >
                                        ·
                                    </span>
                                    <FilterLink
                                        label={t}
                                        active={filter === t}
                                        onClick={() => setFilter(t)}
                                    />
                                </Fragment>
                            ))}
                        </nav>
                    )}
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <p className="px-8 py-16 text-center font-display text-[15px] text-muted-foreground/80 italic">
                            {logs.length === 0
                                ? '— Nothing has been written.'
                                : '— Nothing in this view.'}
                        </p>
                    ) : (
                        <ol className="space-y-1.5 px-6 py-5">
                            {filtered.map((log) => (
                                <LogEntry
                                    key={log.id}
                                    log={log}
                                    block={
                                        log.content_block_id &&
                                        blockTitleResolver
                                            ? blockTitleResolver(
                                                  log.content_block_id,
                                              )
                                            : null
                                    }
                                    topic={
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

interface StatProps {
    label: string;
    value: string;
}

function Stat({ label, value }: StatProps) {
    return (
        <div>
            <div className="font-display text-[24px] leading-none font-semibold tracking-tight text-foreground tabular-nums">
                {value}
            </div>
            <div className="mt-2 font-mono text-[10px] font-medium tracking-[0.16em] text-muted-foreground/70 uppercase">
                {label}
            </div>
        </div>
    );
}

interface FilterLinkProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

function FilterLink({ label, active, onClick }: FilterLinkProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'cursor-pointer transition-colors',
                active
                    ? 'font-medium text-foreground underline decoration-foreground/30 underline-offset-4'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {label}
        </button>
    );
}

interface LogEntryProps {
    log: GenerationLogEntry;
    block: string | null;
    topic: string | null;
}

function LogEntry({ log, block, topic }: LogEntryProps) {
    const tone = STAGE_TONE[log.prompt_type] ?? 'var(--muted-foreground)';
    const invalid = !log.is_valid;
    const stripeColor = invalid ? 'var(--badge-danger-fg)' : tone;
    const citation = block ?? (topic ? `Topic · ${topic}` : null);

    return (
        <li
            className="border-l-[3px] py-3 pr-1 pl-4"
            style={{ borderLeftColor: stripeColor }}
        >
            <div className="flex items-baseline gap-3">
                <span className="text-[13.5px] text-foreground">
                    {log.prompt_type}
                    {invalid && (
                        <span className="text-destructive"> · invalid</span>
                    )}
                </span>
                <span className="ml-auto font-mono text-[15px] font-semibold text-foreground tabular-nums">
                    {formatCost(log.estimated_cost_cents)}
                </span>
            </div>

            <p className="tech mt-1.5 truncate">
                {log.model_used || '—'}
                <span className="text-muted-foreground/60"> · </span>
                {log.tokens_used.toLocaleString()} tk
                <span className="text-muted-foreground/60"> · </span>
                <time
                    dateTime={log.created_at}
                    title={new Date(log.created_at).toLocaleString()}
                >
                    {formatRelTime(log.created_at)}
                </time>
            </p>

            {citation && (
                <p className="mt-1.5 truncate text-[12.5px] text-muted-foreground/90">
                    {citation}
                </p>
            )}
        </li>
    );
}
