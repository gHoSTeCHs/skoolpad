import { CalendarDays } from 'lucide-react';
import type { WeeklySummary } from '@/types/parent';

interface WeeklySummaryCardProps {
    summary: WeeklySummary | null;
}

function formatMinutesAsHours(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function getDayLabel(dateString: string): string {
    const date = new Date(`${dateString}T12:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
    return (
        <div className="h-full rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Weekly Summary
                </h3>
            </div>

            {!summary ? (
                <p className="text-sm text-muted-foreground">No weekly data yet.</p>
            ) : (
                <div className="space-y-3">
                    <BarChart days={summary.study_minutes_by_day} />

                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div>
                            <span className="font-medium text-foreground">{summary.total_check_ins}</span>{' '}
                            check-ins
                        </div>
                        <div>
                            <span className="font-medium text-foreground">
                                {formatMinutesAsHours(summary.total_app_minutes)}
                            </span>{' '}
                            app time
                        </div>
                        <div>
                            <span className="font-medium text-foreground">{summary.topics_verified}</span>{' '}
                            topics verified
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface BarChartProps {
    days: WeeklySummary['study_minutes_by_day'];
}

function BarChart({ days }: BarChartProps) {
    const maxMinutes = Math.max(...days.map((d) => d.minutes), 1);

    return (
        <div className="flex items-end gap-1" style={{ height: 64 }}>
            {days.map((day) => {
                const heightPx = day.minutes > 0
                    ? Math.max(2, Math.round((day.minutes / maxMinutes) * 56))
                    : 2;

                return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                        <div
                            className="w-full rounded-sm bg-[var(--canopy-500)]"
                            style={{ height: heightPx }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                            {getDayLabel(day.date)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
