import { cn } from '@/lib/utils';

interface StreakDay {
    label: string;
    state: 'completed' | 'today' | 'upcoming';
}

interface StreakWidgetProps {
    count: number;
    days: StreakDay[];
    className?: string;
}

const dotStateClasses: Record<StreakDay['state'], string> = {
    completed: 'bg-[var(--streak-dot-on-bg)] text-[var(--streak-dot-on-fg)]',
    today: 'bg-[var(--streak-dot-now-bg)] text-[var(--streak-dot-now-fg)]',
    upcoming: 'bg-[var(--streak-dot-off-bg)] text-[var(--streak-dot-off-fg)]',
};

export default function StreakWidget({ count, days, className }: StreakWidgetProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden p-6 text-white reader:border reader:border-[rgba(62,189,147,0.15)]',
                className,
            )}
            style={{
                background: 'var(--streak-bg)',
                borderRadius: 'var(--card-radius)',
                animation: undefined,
            }}
        >
            <div
                className="absolute -top-[40%] -right-[15%] h-[180px] w-[180px] rounded-full reader:bg-[radial-gradient(circle,rgba(62,189,147,0.08)_0%,transparent_70%)]"
                style={{ background: 'rgba(255,255,255,0.1)' }}
            />

            <div
                className="relative z-[1] text-[48px] font-extrabold leading-none"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
            >
                {count}&#128293;
            </div>

            <div
                className="relative z-[1] mt-[3px] text-[13px] font-medium opacity-70"
                style={{ fontFamily: 'var(--font-body)' }}
            >
                Day study streak
            </div>

            <div className="relative z-[1] mt-[14px] flex gap-[5px]">
                {days.map((day, i) => (
                    <div
                        key={i}
                        className={cn(
                            'flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-bold',
                            dotStateClasses[day.state],
                            day.state === 'today' && 'reader:shadow-[0_0_12px_rgba(62,189,147,0.4)]',
                        )}
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        {day.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
