import { router } from '@inertiajs/react';
import { BookOpen, RotateCcw, Target } from 'lucide-react';
import { startStudying } from '@/actions/App/Http/Controllers/Student/ExamTimetableController';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DailyStudyPlan } from '@/types/study-planner';

interface DailyPlanCardProps {
    dailyPlan: DailyStudyPlan;
}

const actionIcons = {
    read: BookOpen,
    practice: Target,
    review: RotateCcw,
} as const;

const actionLabels = {
    read: 'Read',
    practice: 'Practice',
    review: 'Review',
} as const;

export function DailyPlanCard({ dailyPlan }: DailyPlanCardProps) {
    function handleStartStudying() {
        router.post(startStudying.url());
    }

    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-display text-sm font-semibold tracking-tight">Today&apos;s Study Plan</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {dailyPlan.total_minutes} min · {dailyPlan.reason}
                    </p>
                </div>
                <Button size="sm" onClick={handleStartStudying}>
                    Start Studying
                </Button>
            </div>

            {dailyPlan.exam_breakdown.length > 0 && (
                <div className="mt-3 space-y-1.5">
                    {dailyPlan.exam_breakdown.map((exam) => (
                        <div key={exam.entry_id} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-medium truncate">{exam.subject_name}</span>
                                <span className="shrink-0 text-muted-foreground tabular-nums">
                                    {exam.allocated_minutes} min · {exam.days_remaining}d left
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        exam.days_remaining <= 2
                                            ? 'bg-red-500 dark:bg-red-400 reader:bg-red-400'
                                            : exam.days_remaining <= 7
                                              ? 'bg-amber-500 dark:bg-amber-400 reader:bg-amber-400'
                                              : 'bg-emerald-500 dark:bg-emerald-400 reader:bg-emerald-400',
                                    )}
                                    style={{
                                        width: `${Math.min(100, (exam.ready_topic_count / Math.max(1, exam.ready_topic_count + exam.weak_topic_count)) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {dailyPlan.items.length > 0 && (
                <div className="mt-3 space-y-1">
                    {dailyPlan.items.slice(0, 5).map((item, i) => {
                        const Icon = actionIcons[item.action] ?? Target;
                        return (
                            <div
                                key={`${item.topic_id ?? i}-${item.action}`}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent/50"
                            >
                                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate" style={{ fontFamily: 'var(--font-body)' }}>
                                    {item.topic_title}
                                </span>
                                <span className="shrink-0 text-[10px] text-muted-foreground">
                                    {actionLabels[item.action]} · {item.estimated_minutes}m
                                </span>
                            </div>
                        );
                    })}
                    {dailyPlan.items.length > 5 && (
                        <p className="px-2 text-[10px] text-muted-foreground">
                            +{dailyPlan.items.length - 5} more items
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
