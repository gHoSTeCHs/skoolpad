import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type PillTone = 'success' | 'warning' | 'neutral' | 'danger';

interface StatusPillProps {
    tone: PillTone;
    children: ReactNode;
    className?: string;
}

const TONE_CLASS: Record<PillTone, string> = {
    success: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    warning: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    neutral: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    danger: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

export function StatusPill({ tone, children, className }: StatusPillProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium leading-snug',
                TONE_CLASS[tone],
                className,
            )}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-85" aria-hidden />
            {children}
        </span>
    );
}
