import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center border border-border bg-card p-8 text-center',
                className,
            )}
            style={{ borderRadius: 'var(--card-radius)' }}
        >
            <div className="mb-[14px] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-raised)] text-2xl">
                {icon}
            </div>

            <div
                className="mb-[6px] text-[16px] font-semibold"
                style={{ fontFamily: 'var(--font-display)' }}
            >
                {title}
            </div>

            <div
                className="mx-auto mb-[18px] max-w-[260px] leading-snug"
                style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                }}
            >
                {description}
            </div>

            {actionLabel && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
