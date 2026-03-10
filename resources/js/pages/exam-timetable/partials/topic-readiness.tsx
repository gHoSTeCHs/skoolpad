import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TopicReadiness as TopicReadinessItem } from '@/types/study-planner';

interface TopicReadinessProps {
    readiness: TopicReadinessItem[];
    entryId: string;
}

const statusConfig: Record<TopicReadinessItem['status'], { label: string; className: string }> = {
    not_started: {
        label: 'Not Started',
        className: 'bg-muted text-muted-foreground',
    },
    read_only: {
        label: 'Read Only',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300',
    },
    weak: {
        label: 'Weak',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 reader:bg-red-900/40 reader:text-red-300',
    },
    developing: {
        label: 'Developing',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    },
    strong: {
        label: 'Strong',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 reader:bg-emerald-900/40 reader:text-emerald-300',
    },
};

export function TopicReadiness({ readiness, entryId }: TopicReadinessProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (readiness.length === 0) return null;

    const strongCount = readiness.filter((r) => r.status === 'strong').length;
    const weakCount = readiness.filter((r) => r.status === 'weak' || r.status === 'not_started').length;

    return (
        <div className="rounded-lg border">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Topic Readiness</span>
                    <span className="text-[10px] text-muted-foreground">
                        {strongCount}/{readiness.length} ready
                        {weakCount > 0 && ` · ${weakCount} need work`}
                    </span>
                </div>
                <ChevronDown
                    className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                />
            </button>

            {isOpen && (
                <div className="border-t px-3 py-2 space-y-1.5">
                    {readiness.map((item) => {
                        const config = statusConfig[item.status];
                        return (
                            <div
                                key={`${entryId}-${item.topic_id}`}
                                className="flex items-center justify-between gap-2 py-1"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="truncate text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                                        {item.topic_title}
                                    </span>
                                    {item.is_aoc && (
                                        <Badge variant="outline" className="shrink-0 text-[9px] px-1 py-0">
                                            AOC
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    {item.attempts > 0 && (
                                        <span className="text-[10px] tabular-nums text-muted-foreground">
                                            {Math.round(item.accuracy * 100)}%
                                        </span>
                                    )}
                                    <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium', config.className)}>
                                        {config.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
