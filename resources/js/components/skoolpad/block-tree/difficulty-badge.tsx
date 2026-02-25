import SpBadge from '@/components/skoolpad/sp-badge';

const DIFFICULTY_VARIANTS: Record<string, 'primary' | 'danger' | 'reward'> = {
    beginner: 'primary',
    intermediate: 'reward',
    advanced: 'danger',
};

export default function DifficultyBadge({ level, className }: { level: string | null; className?: string }) {
    if (!level) return null;
    const variant = DIFFICULTY_VARIANTS[level] ?? 'primary';
    return (
        <SpBadge variant={variant} className={className ?? 'px-[6px] py-0 text-[9px]'}>
            {level}
        </SpBadge>
    );
}
