import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import type { ChildDailyActivity } from '@/types/parent';

interface DailyActivityCardProps {
    activity: ChildDailyActivity | null;
    childName: string;
}

export function DailyActivityCard({ activity, childName }: DailyActivityCardProps) {
    if (!activity) {
        return (
            <div className="h-full rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Activity className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Today&apos;s Activity
                    </h3>
                </div>
                <p className="text-sm text-muted-foreground">No activity data yet.</p>
            </div>
        );
    }

    return (
        <div className="h-full rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
                <Activity className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Today's Activity
                </h3>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    {activity.studied_today ? (
                        <>
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                            <span className="text-sm text-foreground">
                                {childName} studied for {activity.study_minutes_today} min today
                            </span>
                        </>
                    ) : (
                        <>
                            <XCircle className="size-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                                {childName} hasn't studied today yet
                            </span>
                        </>
                    )}
                </div>

                {activity.subjects_today.length > 0 && (
                    <div className="space-y-1.5">
                        {activity.subjects_today.map((subject) => (
                            <div
                                key={subject.name}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="text-muted-foreground">{subject.name}</span>
                                <span className="font-medium">{subject.minutes} min</span>
                            </div>
                        ))}
                    </div>
                )}

                {activity.guided_study_progress && (
                    <p className="text-xs text-muted-foreground">
                        Guided study: {activity.guided_study_progress.completed}/{activity.guided_study_progress.total} tasks
                    </p>
                )}
            </div>
        </div>
    );
}
