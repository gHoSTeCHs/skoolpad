import type { CalendarDay } from '@/hooks/use-calendar';
import type { WeeklyScheduleSlot } from '@/hooks/use-weekly-schedule';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { CalendarDayCell } from './calendar-day-cell';

interface LectureDayCellProps {
    day: CalendarDay;
    slots: WeeklyScheduleSlot[];
    isSelected?: boolean;
    inSession?: boolean;
    isSessionStart?: boolean;
    isSessionEnd?: boolean;
    className?: string;
    children?: React.ReactNode;
}

function formatShortTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return m > 0 ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

export function LectureDayCell({ day, slots, isSelected, inSession, isSessionStart, isSessionEnd, className, children }: LectureDayCellProps) {
    const isMobile = useIsMobile();

    return (
        <CalendarDayCell
            day={day}
            isSelected={isSelected}
            className={cn(
                inSession && day.isCurrentMonth && 'bg-primary/[0.04] dark:bg-primary/[0.08] reader:bg-primary/[0.08]',
                isSessionStart && day.isCurrentMonth && 'rounded-l-xl bg-primary/[0.08] dark:bg-primary/[0.12] reader:bg-primary/[0.12]',
                isSessionEnd && day.isCurrentMonth && 'rounded-r-xl bg-primary/[0.08] dark:bg-primary/[0.12] reader:bg-primary/[0.12]',
                className,
            )}
        >
            {slots.length > 0 && day.isCurrentMonth && (
                <>
                    {!isMobile && (
                        <div className="mt-0.5 flex w-full flex-col gap-px">
                            {slots.length <= 2 ? (
                                slots.map((slot) => (
                                    <div key={slot.id} className="flex items-baseline justify-between gap-1 px-0.5">
                                        <span className="truncate text-[9px] font-semibold text-primary/80">
                                            {slot.courseCode}
                                        </span>
                                        <span className="shrink-0 text-[8px] text-muted-foreground">
                                            {formatShortTime(slot.startTime)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-baseline justify-between gap-1 px-0.5">
                                        <span className="truncate text-[9px] font-semibold text-primary/80">
                                            {slots[0].courseCode}
                                        </span>
                                        <span className="shrink-0 text-[8px] text-muted-foreground">
                                            {formatShortTime(slots[0].startTime)}
                                        </span>
                                    </div>
                                    <span className="text-[8px] font-medium text-primary/60">
                                        +{slots.length - 1} more
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {isMobile && (
                        <div className="mt-0.5 flex items-center gap-0.5">
                            {slots.length <= 3 ? (
                                slots.map((slot) => (
                                    <span key={slot.id} className="size-1.5 rounded-full bg-primary/70" />
                                ))
                            ) : (
                                <>
                                    <span className="size-1.5 rounded-full bg-primary/70" />
                                    <span className="size-1.5 rounded-full bg-primary/70" />
                                    <span className="text-[8px] font-bold text-primary/70">
                                        {slots.length}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
            {children}
        </CalendarDayCell>
    );
}
