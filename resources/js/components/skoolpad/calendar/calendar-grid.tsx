import type { CalendarDay } from '@/hooks/use-calendar';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
    weeks: CalendarDay[][];
    weekDayLabels: string[];
    renderDay: (day: CalendarDay) => React.ReactNode;
    onDateClick?: (day: CalendarDay) => void;
    className?: string;
}

export function CalendarGrid({ weeks, weekDayLabels, renderDay, onDateClick, className }: CalendarGridProps) {
    return (
        <div className={cn('grid grid-cols-7 gap-0.5', className)}>
            {weekDayLabels.map((label) => (
                <div
                    key={label}
                    className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs"
                >
                    {label}
                </div>
            ))}
            {weeks.map((week, wi) =>
                week.map((day) => (
                    <button
                        key={day.dateKey}
                        type="button"
                        tabIndex={wi === 0 && day.isCurrentMonth ? 0 : -1}
                        onClick={() => onDateClick?.(day)}
                        className="cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {renderDay(day)}
                    </button>
                )),
            )}
        </div>
    );
}
