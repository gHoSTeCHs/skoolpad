import { cn } from '@/lib/utils';

type BadgeVariant = 'primary' | 'danger' | 'reward' | 'neutral' | 'solid';

interface SpBadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    danger: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
    reward: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    neutral: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    solid: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)]',
};

export default function SpBadge({ variant = 'primary', children, className }: SpBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-[5px] rounded-full px-[10px] py-1 text-[11px] font-semibold',
                variant === 'solid' && 'font-bold',
                variantClasses[variant],
                className,
            )}
            style={{ fontFamily: 'var(--font-body)' }}
        >
            {children}
        </span>
    );
}
