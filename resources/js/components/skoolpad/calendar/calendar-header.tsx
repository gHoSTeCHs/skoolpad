import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarHeaderProps {
    monthLabel: string;
    isCurrentMonthToday: boolean;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
    className?: string;
    children?: React.ReactNode;
}

export function CalendarHeader({
    monthLabel,
    isCurrentMonthToday,
    onPrevMonth,
    onNextMonth,
    onToday,
    className,
    children,
}: CalendarHeaderProps) {
    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onPrevMonth} aria-label="Previous month">
                    <ChevronLeft className="size-4" />
                </Button>
                <h3
                    className="min-w-[140px] text-center text-sm font-semibold tracking-tight md:text-base"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    {monthLabel}
                </h3>
                <Button variant="ghost" size="icon" onClick={onNextMonth} aria-label="Next month">
                    <ChevronRight className="size-4" />
                </Button>
                {!isCurrentMonthToday && (
                    <Button variant="outline" size="sm" onClick={onToday} className="ml-1 text-xs">
                        Today
                    </Button>
                )}
            </div>
            {children && <div className="flex flex-wrap items-center gap-1.5 md:gap-2">{children}</div>}
        </div>
    );
}
