import { cn } from '@/lib/utils';

interface ReviewCalendarProps {
    calendar: Record<number, number>;
}

function getIntensity(count: number): string {
    if (count === 0) return 'bg-muted/40';
    if (count <= 2) return 'bg-emerald-100 dark:bg-emerald-950/50 reader:bg-emerald-950/50';
    if (count <= 5) return 'bg-emerald-200 dark:bg-emerald-900/60 reader:bg-emerald-900/60';
    if (count <= 10) return 'bg-emerald-300 dark:bg-emerald-800/70 reader:bg-emerald-800/70';
    return 'bg-emerald-400 dark:bg-emerald-700/80 reader:bg-emerald-700/80';
}

function getTextColor(count: number): string {
    if (count === 0) return 'text-muted-foreground/50';
    if (count <= 2) return 'text-emerald-700 dark:text-emerald-300 reader:text-emerald-300';
    return 'text-emerald-800 dark:text-emerald-200 reader:text-emerald-200';
}

export default function ReviewCalendar({ calendar }: ReviewCalendarProps) {
    const today = new Date();

    const days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const count = calendar[i] ?? 0;

        return {
            dayLabel: date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
            dateLabel: date.getDate().toString(),
            count,
            isToday: i === 0,
        };
    });

    return (
        <div className="rounded-xl border bg-card p-4">
            <h3 className="font-display text-sm font-semibold tracking-tight">Upcoming Reviews</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Next 14 days
            </p>

            <div className="mt-4 grid grid-cols-7 gap-1.5">
                {days.map((day, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors',
                            getIntensity(day.count),
                            day.isToday && 'ring-2 ring-primary/40',
                        )}
                    >
                        <span className="text-[9px] font-medium uppercase text-muted-foreground">{day.dayLabel}</span>
                        <span className="text-[11px] font-medium text-foreground">{day.dateLabel}</span>
                        <span className={cn('text-[10px] font-semibold tabular-nums', getTextColor(day.count))}>
                            {day.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
