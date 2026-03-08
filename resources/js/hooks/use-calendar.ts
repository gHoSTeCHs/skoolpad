import { useCallback, useMemo, useState } from 'react';

export interface UseCalendarOptions {
    initialMonth?: Date;
    weekStartsOn?: 0 | 1;
}

export interface CalendarDay {
    date: Date;
    dateKey: string;
    dayOfMonth: number;
    isToday: boolean;
    isCurrentMonth: boolean;
    isWeekend: boolean;
}

export interface UseCalendarReturn {
    currentMonth: Date;
    monthLabel: string;
    yearLabel: string;
    weeks: CalendarDay[][];
    weekDayLabels: string[];
    goToPrevMonth: () => void;
    goToNextMonth: () => void;
    goToToday: () => void;
    goToMonth: (date: Date) => void;
    isCurrentMonthToday: boolean;
}

function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS_SUNDAY: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_LABELS_MONDAY: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function buildWeeks(year: number, month: number, weekStartsOn: 0 | 1): CalendarDay[][] {
    const today = new Date();
    const firstOfMonth = new Date(year, month, 1);
    const rawDow = firstOfMonth.getDay();
    const startOffset = (rawDow - weekStartsOn + 7) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);

    const weeks: CalendarDay[][] = [];
    const cursor = new Date(gridStart);

    for (let w = 0; w < 6; w++) {
        const week: CalendarDay[] = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(cursor);
            const dayOfWeek = date.getDay();
            week.push({
                date,
                dateKey: formatDateKey(date),
                dayOfMonth: date.getDate(),
                isToday: isSameDay(date, today),
                isCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
    }

    return weeks;
}

export function useCalendar(options: UseCalendarOptions = {}): UseCalendarReturn {
    const { weekStartsOn = 0 } = options;
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        if (options.initialMonth) {
            return new Date(options.initialMonth.getFullYear(), options.initialMonth.getMonth(), 1);
        }
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const weeks = useMemo(() => buildWeeks(year, month, weekStartsOn), [year, month, weekStartsOn]);

    const monthLabel = `${MONTH_NAMES[month]} ${year}`;
    const yearLabel = String(year);

    const weekDayLabels = weekStartsOn === 1 ? DAY_LABELS_MONDAY : DAY_LABELS_SUNDAY;

    const today = new Date();
    const isCurrentMonthToday = today.getFullYear() === year && today.getMonth() === month;

    const goToPrevMonth = useCallback(() => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        const now = new Date();
        setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }, []);

    const goToMonth = useCallback((date: Date) => {
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }, []);

    return {
        currentMonth,
        monthLabel,
        yearLabel,
        weeks,
        weekDayLabels,
        goToPrevMonth,
        goToNextMonth,
        goToToday,
        goToMonth,
        isCurrentMonthToday,
    };
}
