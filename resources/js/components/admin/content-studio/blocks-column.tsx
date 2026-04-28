import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { comparePaths } from '@/lib/content-studio';
import { TopicActionsMenu } from './topic-actions-menu';
import type { ContentBlock, TopicWithBlocks } from '@/types/content-studio';

interface BlocksColumnProps {
    topic: TopicWithBlocks;
    activeBlockId: string | null;
    busyBlockId: string | null;
    onBlockClick: (blockId: string) => void;
    onGenerateAllClick: () => void;
    onMarkCompleteClick: () => void;
    onResetClick: () => void;
    generateAllDisabled: boolean;
    canMarkComplete: boolean;
}

type BlockUiStatus = 'approved' | 'generated' | 'generating' | 'advisory' | 'not_started';

function uiStatusFor(block: ContentBlock, isBusy: boolean): BlockUiStatus {
    if (isBusy) return 'generating';
    if (block.drift_advisory) return 'advisory';
    return block.generation_status as BlockUiStatus;
}

const STATUS_DOT_CLASS: Record<BlockUiStatus, string> = {
    approved: 'bg-[var(--badge-primary-bg)]',
    generated: 'bg-[var(--badge-reward-bg)]',
    generating: 'bg-[color:var(--honey)] gen-pulse',
    advisory: 'bg-[var(--badge-danger-bg)]',
    not_started: 'bg-muted-foreground/30',
};

export function BlocksColumn({
    topic,
    activeBlockId,
    busyBlockId,
    onBlockClick,
    onGenerateAllClick,
    onMarkCompleteClick,
    onResetClick,
    generateAllDisabled,
    canMarkComplete,
}: BlocksColumnProps) {
    const leafBlocks = useMemo(
        () => topic.blocks.filter((b) => !b.is_container).sort((a, b) => comparePaths(a.path, b.path)),
        [topic.blocks],
    );

    const approvedCount = leafBlocks.filter((b) => b.generation_status === 'approved').length;
    const notStartedCount = leafBlocks.filter((b) => b.generation_status === 'not_started').length;

    return (
        <div className="flex h-full flex-col border-r border-border bg-background">
            <div className="border-b border-border px-4 pt-4 pb-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h2 className="truncate font-display text-[15px] font-semibold tracking-tight">{topic.title}</h2>
                    <span className="tech">
                        {approvedCount}/{leafBlocks.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onGenerateAllClick}
                        disabled={generateAllDisabled}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-border/70 hover:text-foreground disabled:opacity-50"
                    >
                        <Zap className="h-3 w-3" />
                        Generate all{notStartedCount > 0 ? ` (${notStartedCount} left)` : ''}
                    </button>
                    <TopicActionsMenu
                        onMarkCompleteClick={onMarkCompleteClick}
                        onResetClick={onResetClick}
                        canMarkComplete={canMarkComplete}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
                {leafBlocks.map((block) => {
                    const isBusy = busyBlockId === block.id;
                    const isActive = activeBlockId === block.id;
                    const status = uiStatusFor(block, isBusy);

                    return (
                        <button
                            key={block.id}
                            type="button"
                            onClick={() => onBlockClick(block.id)}
                            aria-current={isActive ? 'true' : undefined}
                            className={cn(
                                'grid w-full grid-cols-[32px_1fr_auto] items-start gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors',
                                isActive
                                    ? 'border-l-foreground bg-card'
                                    : 'border-l-transparent hover:bg-muted',
                            )}
                        >
                            <span className="pt-px text-right tech">{block.path}</span>
                            <div className="min-w-0">
                                <div
                                    className={cn(
                                        'text-[13px] leading-snug',
                                        block.generation_status === 'not_started'
                                            ? 'text-muted-foreground'
                                            : 'text-foreground',
                                        isActive && 'font-medium',
                                    )}
                                >
                                    {block.title}
                                </div>
                                {isBusy && (
                                    <div className="mt-0.5 text-[11.5px] font-medium text-[color:var(--honey)]">
                                        Generating…
                                    </div>
                                )}
                                {!isBusy && block.drift_advisory && (
                                    <div className="mt-0.5 text-[11.5px] text-[color:var(--badge-danger-fg)]">
                                        Drift advisory · review
                                    </div>
                                )}
                                {!isBusy && !block.drift_advisory && block.generation_status === 'generated' && (
                                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">Awaiting approval</div>
                                )}
                            </div>
                            <span className={cn('mt-1.5 h-2 w-2 rounded-full', STATUS_DOT_CLASS[status])} />
                        </button>
                    );
                })}

                {leafBlocks.length === 0 && (
                    <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                        No leaf blocks for this topic.
                    </div>
                )}
            </div>
        </div>
    );
}
