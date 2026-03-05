import { Link } from '@inertiajs/react';
import { CalendarClock, GraduationCap, Target } from 'lucide-react';

import { configure as practiceConfigureRoute } from '@/actions/App/Http/Controllers/Student/PracticeController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExamGoalData } from '@/types/practice';

interface ExamGoalCardProps {
    goal: ExamGoalData;
}

function getUrgencyColor(days: number | null): { text: string; bg: string; border: string; badge: string } {
    if (days === null) return {
        text: 'text-muted-foreground',
        bg: 'bg-muted/30',
        border: 'border-border',
        badge: 'bg-muted text-muted-foreground',
    };
    if (days <= 7) return {
        text: 'text-red-600 dark:text-red-400 reader:text-red-400',
        bg: 'bg-red-50/60 dark:bg-red-950/20 reader:bg-red-950/20',
        border: 'border-red-200 dark:border-red-900/40 reader:border-red-900/40',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 reader:bg-red-900/40 reader:text-red-300',
    };
    if (days <= 30) return {
        text: 'text-amber-600 dark:text-amber-400 reader:text-amber-400',
        bg: 'bg-amber-50/60 dark:bg-amber-950/20 reader:bg-amber-950/20',
        border: 'border-amber-200 dark:border-amber-900/40 reader:border-amber-900/40',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    };
    return {
        text: 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400',
        bg: 'bg-emerald-50/40 dark:bg-emerald-950/15 reader:bg-emerald-950/15',
        border: 'border-emerald-200 dark:border-emerald-900/40 reader:border-emerald-900/40',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 reader:bg-emerald-900/40 reader:text-emerald-300',
    };
}

export function ExamGoalCard({ goal }: ExamGoalCardProps) {
    const urgency = getUrgencyColor(goal.days_remaining);
    const configureUrl = practiceConfigureRoute.url({
        query: { assessment_type_id: goal.assessment_type.id },
    });

    return (
        <div className={cn('group relative rounded-xl border p-5 transition-shadow hover:shadow-md', urgency.border, 'bg-card')}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                        <h3 className="truncate font-display text-base font-semibold tracking-tight">
                            {goal.assessment_type.name}
                        </h3>
                    </div>
                    {goal.institution_course && (
                        <p className="mt-1 truncate text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {goal.institution_course.course_code} — {goal.institution_course.course_title}
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 gap-1.5">
                    {goal.assessment_type.is_exit_exam && (
                        <Badge variant="outline" className="text-[10px]">Exit</Badge>
                    )}
                    {goal.assessment_type.is_entrance_exam && (
                        <Badge variant="outline" className="text-[10px]">Entrance</Badge>
                    )}
                </div>
            </div>

            <div className={cn('mt-4 flex items-center gap-4 rounded-lg px-3 py-2.5', urgency.bg)}>
                <div className="flex items-center gap-2">
                    <CalendarClock className={cn('size-4 shrink-0', urgency.text)} />
                    {goal.days_remaining !== null ? (
                        <div className="flex items-baseline gap-1.5">
                            <span className={cn('font-display text-xl font-bold tabular-nums leading-none', urgency.text)}>
                                {goal.days_remaining}
                            </span>
                            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {goal.days_remaining === 1 ? 'day left' : 'days left'}
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            No exam date set
                        </span>
                    )}
                </div>

                {goal.target_score !== null && (
                    <div className="ml-auto flex items-center gap-1.5">
                        <Target className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium tabular-nums text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Target: {goal.target_score}%
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <Button size="sm" className="w-full" asChild>
                    <Link href={configureUrl}>Start Daily Prep</Link>
                </Button>
            </div>
        </div>
    );
}
