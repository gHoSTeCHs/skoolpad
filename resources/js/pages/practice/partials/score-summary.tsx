import { useEffect, useState } from 'react';

import { modeLabels } from '@/lib/practice';
import { cn, formatDuration } from '@/lib/utils';
import type { PracticeResultsPageProps } from '@/types/practice';

interface ScoreSummaryProps {
    session: PracticeResultsPageProps['session'];
}

export function ScoreSummary({ session }: ScoreSummaryProps) {
    const score = session.score_percentage ?? 0;
    const isGreat = score >= 80;
    const scoreColor = isGreat ? 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400'
        : score >= 60 ? 'text-yellow-600 dark:text-yellow-400 reader:text-yellow-400'
        : 'text-destructive';
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isGreat) {
            const timer = setTimeout(() => setAnimate(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isGreat]);

    return (
        <div className={cn('rounded-xl border bg-card p-6 text-center transition-all duration-700', isGreat && animate && 'ring-2 ring-emerald-500/30')}>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {modeLabels[session.mode] ?? session.mode}
            </span>

            <div className="mt-4 relative">
                {isGreat && animate && (
                    <span className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute h-20 w-20 animate-ping rounded-full bg-emerald-400/20" />
                    </span>
                )}
                <span className={cn(
                    'font-display text-5xl font-bold tabular-nums relative',
                    scoreColor,
                    isGreat && animate && 'animate-bounce',
                )} style={{ animationIterationCount: 2, animationDuration: '0.6s' }}>
                    {Math.round(score)}%
                </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {session.correct_count}/{session.question_count} correct ({Math.round(score)}%)
            </p>

            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {session.total_time_seconds !== null && (
                    <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                            <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
                        </svg>
                        <span>{formatDuration(session.total_time_seconds)}</span>
                    </div>
                )}
                {session.institution_course && (
                    <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                            <path d="M7.702 1.368a.75.75 0 0 1 .597 0c2.098.91 4.105 1.99 6.004 3.223a.75.75 0 0 1-.194 1.348A34.27 34.27 0 0 0 8.341 8.25a.75.75 0 0 1-.682 0c-1.85-.895-3.777-1.64-5.768-2.31a.75.75 0 0 1-.194-1.349 39.875 39.875 0 0 1 6.005-3.223ZM1.5 7.444c.292.107.58.22.865.339a36.136 36.136 0 0 1 5.336 2.86.75.75 0 0 0 .598 0 36.136 36.136 0 0 1 5.336-2.86c.285-.12.573-.232.865-.339v4.233a.75.75 0 0 1-.312.617 41.148 41.148 0 0 0-6.19 4.626.75.75 0 0 1-.998 0 41.148 41.148 0 0 0-6.19-4.626.75.75 0 0 1-.312-.617V7.444Z" />
                        </svg>
                        <span>{session.institution_course.course_code}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
