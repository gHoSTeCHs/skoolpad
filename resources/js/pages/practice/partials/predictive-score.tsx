import { Award, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { PredictiveScore as PredictiveScoreType } from '@/types/practice';

interface PredictiveScoreProps {
    score: PredictiveScoreType;
}

export function PredictiveScore({ score }: PredictiveScoreProps) {
    const gradeColor = score.is_passing
        ? 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400'
        : 'text-destructive';

    const passBg = score.is_passing
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 reader:bg-emerald-900/30 reader:text-emerald-300'
        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 reader:bg-red-900/30 reader:text-red-300';

    return (
        <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
                <Award className="size-4 text-muted-foreground" />
                <h2 className="font-display text-base font-semibold tracking-tight">Predicted Grade</h2>
            </div>

            <div className="mt-4 flex items-center gap-6">
                <div className="text-center">
                    <span className={cn('font-display text-4xl font-bold', gradeColor)}>
                        {score.grade}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        at {Math.round(score.percentage)}%
                    </p>
                </div>

                <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2">
                        <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', passBg)}>
                            {score.is_passing ? 'Passing' : 'Below pass'}
                        </span>
                        <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Pass threshold: {score.pass_threshold}%
                        </span>
                    </div>

                    {score.next_grade && score.points_to_next !== null && score.points_to_next > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            <TrendingUp className="size-3.5" />
                            <span>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {Math.ceil(score.points_to_next)}%
                                </span>
                                {' '}more to reach{' '}
                                <span className="font-semibold text-foreground">{score.next_grade}</span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
