import type { CalendarDay } from '@/hooks/use-calendar';
import { cn } from '@/lib/utils';

interface CalendarDayCellProps {
    day: CalendarDay;
    isSelected?: boolean;
    inPeriod?: boolean;
    isPeriodStart?: boolean;
    isPeriodEnd?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export function CalendarDayCell({ day, isSelected, inPeriod, isPeriodStart, isPeriodEnd, children, className }: CalendarDayCellProps) {
    return (
        <div
            className={cn(
                'relative flex min-h-10 flex-col items-center rounded-lg p-1 transition-colors md:min-h-14 md:p-1.5',
                !day.isCurrentMonth && 'opacity-30',
                day.isWeekend && day.isCurrentMonth && 'text-muted-foreground',
                day.isToday && 'ring-2 ring-primary/40',
                inPeriod && day.isCurrentMonth && 'bg-destructive/[0.04] dark:bg-destructive/[0.08] reader:bg-destructive/[0.08]',
                isPeriodStart && day.isCurrentMonth && 'rounded-l-xl bg-destructive/[0.08] dark:bg-destructive/[0.12] reader:bg-destructive/[0.12]',
                isPeriodEnd && day.isCurrentMonth && 'rounded-r-xl bg-destructive/[0.08] dark:bg-destructive/[0.12] reader:bg-destructive/[0.12]',
                isSelected && 'bg-primary/10 border border-primary/30',
                !isSelected && day.isCurrentMonth && 'hover:bg-accent/50',
                className,
            )}
        >
            <span
                className={cn(
                    'text-xs font-medium tabular-nums md:text-sm',
                    day.isToday && day.isCurrentMonth && 'font-bold text-primary',
                )}
            >
                {day.dayOfMonth}
            </span>
            {children}
        </div>
    );
}
