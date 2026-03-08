import type { CalendarDay } from '@/hooks/use-calendar';
import type { ExamPeriodEntry } from '@/hooks/use-exam-period';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { CalendarDayCell } from './calendar-day-cell';

interface ExamDayCellProps {
    day: CalendarDay;
    entries: ExamPeriodEntry[];
    isSelected?: boolean;
    inPeriod?: boolean;
    isPeriodStart?: boolean;
    isPeriodEnd?: boolean;
    className?: string;
}

function formatShortTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return m > 0 ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

export function ExamDayCell({ day, entries, isSelected, inPeriod, isPeriodStart, isPeriodEnd, className }: ExamDayCellProps) {
    const isMobile = useIsMobile();

    return (
        <CalendarDayCell
            day={day}
            isSelected={isSelected}
            inPeriod={inPeriod}
            isPeriodStart={isPeriodStart}
            isPeriodEnd={isPeriodEnd}
            className={className}
        >
            {entries.length > 0 && day.isCurrentMonth && (
                <>
                    {!isMobile && (
                        <div className="mt-0.5 flex w-full flex-col gap-px">
                            {entries.length <= 2 ? (
                                entries.map((entry) => (
                                    <div key={entry.id} className="flex items-baseline justify-between gap-1 px-0.5">
                                        <span className="truncate text-[9px] font-semibold text-destructive/80">
                                            {entry.courseCode}
                                        </span>
                                        <span className="shrink-0 text-[8px] text-muted-foreground">
                                            {formatShortTime(entry.time)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-baseline justify-between gap-1 px-0.5">
                                        <span className="truncate text-[9px] font-semibold text-destructive/80">
                                            {entries[0].courseCode}
                                        </span>
                                        <span className="shrink-0 text-[8px] text-muted-foreground">
                                            {formatShortTime(entries[0].time)}
                                        </span>
                                    </div>
                                    <span className="text-[8px] font-medium text-destructive/60">
                                        +{entries.length - 1} more
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {isMobile && (
                        <div className="mt-0.5 flex items-center gap-0.5">
                            {entries.length <= 3 ? (
                                entries.map((entry) => (
                                    <span key={entry.id} className="size-1.5 rounded-full bg-destructive/70" />
                                ))
                            ) : (
                                <>
                                    <span className="size-1.5 rounded-full bg-destructive/70" />
                                    <span className="size-1.5 rounded-full bg-destructive/70" />
                                    <span className="text-[8px] font-bold text-destructive/70">
                                        {entries.length}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </CalendarDayCell>
    );
}
