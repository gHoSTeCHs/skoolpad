import { useMemo, useState } from 'react';
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

const FRESH_THRESHOLD_MS = 60_000;
const STAGGER_CAP = 8;
const STAGGER_STEP_MS = 30;

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

                    <dl className="mt-5 grid grid-cols-3 gap-3">
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
                            className="mt-5 -mb-1 flex flex-wrap items-center gap-x-4 gap-y-1"
                        >
                            <FilterTab
                                label="All"
                                active={filter === null}
                                onClick={() => setFilter(null)}
                            />
                            {promptTypes.map((t) => (
                                <FilterTab
                                    key={t}
                                    label={t}
                                    active={filter === t}
                                    onClick={() => setFilter(t)}
                                />
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
                        <ol className="relative px-4 pt-5 pb-8">
                            <span
                                className="pointer-events-none absolute top-7 bottom-3 w-px bg-border"
                                style={{ left: 84 }}
                                aria-hidden
                            />
                            {filtered.map((log, i) => (
                                <LogEntry
                                    key={log.id}
                                    log={log}
                                    index={i}
                                    fresh={
                                        i === 0 &&
                                        Date.now() -
                                            new Date(log.created_at).getTime() <
                                            FRESH_THRESHOLD_MS
                                    }
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
            <dt className="font-mono text-[10px] font-medium tracking-[0.16em] text-muted-foreground/70 uppercase">
                {label}
            </dt>
            <dd className="mt-1.5 font-display text-[22px] leading-none font-semibold tracking-tight tabular-nums">
                {value}
            </dd>
        </div>
    );
}

interface FilterTabProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

function FilterTab({ label, active, onClick }: FilterTabProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'relative cursor-pointer py-1 font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase transition-colors',
                active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {label}
            <span
                className={cn(
                    'pointer-events-none absolute right-0 -bottom-px left-0 h-px transition-colors',
                    active ? 'bg-foreground' : 'bg-transparent',
                )}
                aria-hidden
            />
        </button>
    );
}

interface LogEntryProps {
    log: GenerationLogEntry;
    index: number;
    fresh: boolean;
    block: string | null;
    topic: string | null;
}

function LogEntry({ log, index, fresh, block, topic }: LogEntryProps) {
    const tone = STAGE_TONE[log.prompt_type] ?? 'var(--muted-foreground)';
    const invalid = !log.is_valid;
    const reltime = formatRelTime(log.created_at);
    const citation = block ?? (topic ? `Topic · ${topic}` : null);
    const delay = `${Math.min(index, STAGGER_CAP) * STAGGER_STEP_MS}ms`;

    return (
        <li
            className="relative animate-in py-3.5 pr-2 pl-[100px] duration-300 fill-mode-both fade-in slide-in-from-right-1"
            style={{ animationDelay: delay }}
        >
            <time
                dateTime={log.created_at}
                title={new Date(log.created_at).toLocaleString()}
                className={cn(
                    'tech absolute top-[15px] left-0 w-[72px] text-right tabular-nums',
                    invalid && 'text-destructive/70',
                )}
            >
                {invalid ? `⨯ ${reltime}` : reltime}
            </time>

            <span
                className={cn(
                    'absolute top-[16px] left-[84px] h-2.5 w-2.5 -translate-x-1/2 rounded-full',
                    fresh && 'gen-pulse',
                )}
                style={{
                    border: `2px solid ${invalid ? 'var(--badge-danger-fg)' : tone}`,
                    background: invalid
                        ? 'var(--badge-danger-fg)'
                        : 'var(--card)',
                }}
                aria-hidden
            />

            <div className="flex items-baseline gap-2">
                <span
                    className="font-mono text-[10px] font-medium tracking-[0.14em] uppercase"
                    style={{ color: tone }}
                >
                    {log.prompt_type}
                </span>
                <span className="tech ml-auto tabular-nums">
                    {formatCost(log.estimated_cost_cents)}
                </span>
            </div>

            <p className="mt-1 text-[12.5px] leading-snug">
                <span className="tech text-foreground">
                    {log.model_used || '—'}
                </span>
                <span className="tech text-muted-foreground">
                    {' '}
                    · {log.tokens_used.toLocaleString()} tk
                </span>
                {invalid && (
                    <span className="tech text-destructive"> · invalid</span>
                )}
            </p>

            {citation && (
                <p className="mt-1.5 truncate text-[12.5px] text-muted-foreground">
                    <span className="text-muted-foreground/60">↳ </span>
                    {citation}
                </p>
            )}
        </li>
    );
}
