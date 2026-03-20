import { Link } from '@inertiajs/react';
import { CheckCircle2, ClipboardCheck, Clock } from 'lucide-react';
import type { CheckInSession } from '@/types/parent';

interface CheckInCtaProps {
    checkIn: CheckInSession | null;
    childId: string;
}

export function CheckInCta({ checkIn, childId }: CheckInCtaProps) {
    if (!checkIn) {
        return (
            <div className="h-full rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <ClipboardCheck className="size-5" />
                    <p className="text-sm">No check-in session available yet. Check back later.</p>
                </div>
            </div>
        );
    }

    const itemCount = checkIn.items?.length ?? 0;
    const estimatedMinutes = checkIn.items?.reduce((sum, item) => sum + (item.estimated_minutes ?? 0), 0) ?? 0;
    const completedCount = checkIn.completed_items?.length ?? 0;
    const isCompleted = checkIn.status === 'completed';
    const isInProgress = checkIn.status === 'in_progress';

    if (isCompleted) {
        return (
            <div className="h-full rounded-xl border border-[var(--canopy-200)] bg-[var(--canopy-50)] p-6 dark:border-[var(--canopy-800)] dark:bg-[var(--canopy-950)]">
                <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--canopy-100)] dark:bg-[var(--canopy-900)]">
                        <CheckCircle2 className="size-5 text-[var(--canopy-600)]" />
                    </div>
                    <div>
                        <h3 className="font-display text-base font-bold text-foreground">Check-in Complete</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            You completed {completedCount} {completedCount === 1 ? 'item' : 'items'} tonight. Great work!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full rounded-xl border-2 border-[var(--canopy-300)] bg-gradient-to-br from-[var(--canopy-50)] to-card p-6 shadow-sm dark:border-[var(--canopy-700)] dark:from-[var(--canopy-950)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--canopy-600)] shadow-md">
                        <ClipboardCheck className="size-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-bold text-foreground">
                            {isInProgress ? 'Continue Check-in' : "Tonight's Check-in"}
                        </h3>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <ClipboardCheck className="size-3.5" />
                                {itemCount} {itemCount === 1 ? 'topic' : 'topics'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="size-3.5" />
                                ~{estimatedMinutes} min
                            </span>
                        </div>
                        {isInProgress && completedCount > 0 && (
                            <p className="mt-1 text-xs text-[var(--canopy-600)]">
                                {completedCount} of {itemCount} completed
                            </p>
                        )}
                    </div>
                </div>
                <Link
                    href={`/parent/children/${childId}/check-in`}
                    className="inline-flex items-center justify-center rounded-lg bg-[var(--canopy-600)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--canopy-700)]"
                >
                    {isInProgress ? 'Continue' : 'Start Check-in'}
                </Link>
            </div>
        </div>
    );
}
