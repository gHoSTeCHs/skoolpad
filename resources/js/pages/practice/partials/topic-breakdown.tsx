import { cn } from '@/lib/utils';
import type { PracticeResultsPageProps } from '@/types/practice';

interface TopicBreakdownProps {
    topics: PracticeResultsPageProps['perTopic'];
}

export function TopicBreakdown({ topics }: TopicBreakdownProps) {
    if (topics.length === 0) return null;

    const sorted = [...topics].sort((a, b) => b.total - a.total);

    return (
        <div className="space-y-3">
            {sorted.map((topic) => {
                const pct = topic.accuracy;
                const barColor = pct >= 70
                    ? 'bg-emerald-500'
                    : pct >= 50
                      ? 'bg-yellow-500'
                      : 'bg-destructive';

                const textColor = pct >= 70
                    ? 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400'
                    : pct >= 50
                      ? 'text-yellow-600 dark:text-yellow-400 reader:text-yellow-400'
                      : 'text-destructive';

                return (
                    <div key={topic.topic_id} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                                {topic.topic_title}
                            </span>
                            <span className={cn('shrink-0 text-sm font-semibold tabular-nums', textColor)}>
                                {pct}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn('h-full rounded-full transition-all duration-500', barColor)}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {topic.correct}/{topic.total}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
