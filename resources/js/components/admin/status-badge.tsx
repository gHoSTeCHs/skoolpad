import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
    isActive: boolean;
}

export function StatusBadge({ isActive }: StatusBadgeProps) {
    return (
        <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={
                isActive
                    ? 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)]'
                    : 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]'
            }
        >
            {isActive ? 'Active' : 'Inactive'}
        </Badge>
    );
}
