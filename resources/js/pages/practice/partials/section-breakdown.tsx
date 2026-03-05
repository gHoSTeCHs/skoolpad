import { cn } from '@/lib/utils';
import type { SectionBreakdownData } from '@/types/practice';

interface SectionBreakdownProps {
    sections: SectionBreakdownData[];
}

export function SectionBreakdown({ sections }: SectionBreakdownProps) {
    if (sections.length === 0) return null;

    return (
        <div className="rounded-xl border bg-card p-5">
            <h2 className="font-display text-base font-semibold tracking-tight">Section Breakdown</h2>
            <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Performance by paper section
            </p>

            <div className="mt-4 space-y-3">
                {sections.map((section) => {
                    const pct = section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0;
                    const barColor = pct >= 80
                        ? 'bg-emerald-500'
                        : pct >= 60
                          ? 'bg-yellow-500'
                          : 'bg-destructive';
                    const textColor = pct >= 80
                        ? 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400'
                        : pct >= 60
                          ? 'text-yellow-600 dark:text-yellow-400 reader:text-yellow-400'
                          : 'text-destructive';

                    return (
                        <div key={section.section_label} className="space-y-1.5">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="truncate text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                                    {section.section_label}
                                </span>
                                <div className="flex shrink-0 items-baseline gap-2">
                                    <span className={cn('text-sm font-semibold tabular-nums', textColor)}>
                                        {pct}%
                                    </span>
                                    <span className="text-[11px] tabular-nums text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        {section.marks_earned}/{section.marks_possible} marks
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn('h-full rounded-full transition-all duration-500', barColor)}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    {section.correct}/{section.total}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
