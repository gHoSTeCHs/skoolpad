import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCalendar, type UseCalendarOptions } from '@/hooks/use-calendar';
import { CalendarDayCell } from './calendar-day-cell';
import { CalendarGrid } from './calendar-grid';
import { CalendarHeader } from './calendar-header';

export interface CalendarMiniEvent {
    count: number;
    variant?: 'default' | 'danger' | 'warning' | 'success';
}

interface CalendarMiniProps extends UseCalendarOptions {
    selectedDate?: Date;
    onDateSelect?: (date: Date) => void;
    eventDates?: Map<string, CalendarMiniEvent>;
    className?: string;
}

const VARIANT_DOT_COLORS: Record<string, string> = {
    default: 'bg-primary',
    danger: 'bg-red-500 dark:bg-red-400 reader:bg-red-400',
    warning: 'bg-amber-500 dark:bg-amber-400 reader:bg-amber-400',
    success: 'bg-emerald-500 dark:bg-emerald-400 reader:bg-emerald-400',
};

function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function CalendarMini({
    selectedDate,
    onDateSelect,
    eventDates,
    className,
    ...calendarOptions
}: CalendarMiniProps) {
    const calendar = useCalendar(calendarOptions);
    const selectedKey = selectedDate ? formatDateKey(selectedDate) : null;

    return (
        <Card className={cn('py-4', className)}>
            <CardContent className="px-4">
                <CalendarHeader
                    monthLabel={calendar.monthLabel}
                    isCurrentMonthToday={calendar.isCurrentMonthToday}
                    onPrevMonth={calendar.goToPrevMonth}
                    onNextMonth={calendar.goToNextMonth}
                    onToday={calendar.goToToday}
                />
                <CalendarGrid
                    weeks={calendar.weeks}
                    weekDayLabels={calendar.weekDayLabels}
                    className="mt-2"
                    onDateClick={(day) => onDateSelect?.(day.date)}
                    renderDay={(day) => {
                        const event = eventDates?.get(day.dateKey);
                        const dotColor = event ? (VARIANT_DOT_COLORS[event.variant ?? 'default'] ?? VARIANT_DOT_COLORS.default) : null;

                        return (
                            <CalendarDayCell
                                day={day}
                                isSelected={selectedKey === day.dateKey}
                                className="min-h-8 md:min-h-9"
                            >
                                {dotColor && (
                                    <span className={cn('mt-0.5 size-1.5 rounded-full', dotColor)} />
                                )}
                            </CalendarDayCell>
                        );
                    }}
                />
            </CardContent>
        </Card>
    );
}
