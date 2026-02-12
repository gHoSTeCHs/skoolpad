import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    className?: string;
}

export default function StatCard({ label, value, change, trend, className }: StatCardProps) {
    return (
        <div
            className={cn(
                'group relative overflow-hidden border border-border bg-card p-[22px] transition-all duration-300',
                'reader:hover:border-[rgba(62,189,147,0.2)]',
                className,
            )}
            style={{ borderRadius: 'var(--card-radius)' }}
        >
            <div
                className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-400 group-hover:scale-x-100 reader:hidden"
                style={{
                    background: 'var(--stat-accent)',
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            />

            <div
                className="mb-[6px] text-[11px] font-medium uppercase tracking-[0.04em]"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
            >
                {label}
            </div>

            <div
                className="text-[34px] font-extrabold leading-none tracking-tight"
                style={{
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.03em',
                    color: trend === 'up'
                        ? 'var(--stat-accent)'
                        : trend === 'down'
                            ? 'var(--destructive)'
                            : 'var(--foreground)',
                }}
            >
                {value}
            </div>

            <div
                className="mt-1 text-[12px] font-semibold"
                style={{
                    fontFamily: 'var(--font-body)',
                    color: trend === 'up'
                        ? 'var(--stat-accent)'
                        : trend === 'down'
                            ? 'var(--destructive)'
                            : 'var(--muted-foreground)',
                }}
            >
                {change}
            </div>
        </div>
    );
}
