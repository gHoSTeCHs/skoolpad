import { Badge } from '@/components/ui/badge';

interface StatusPillProps {
    isExisting: boolean;
    isPublished: boolean;
    dirty: boolean;
}

export function StatusPill({ isExisting, isPublished, dirty }: StatusPillProps) {
    if (!isExisting) {
        return <Badge variant="secondary">Not started</Badge>;
    }
    if (dirty) {
        return (
            <Badge
                variant="outline"
                className="border-[rgba(212,149,42,0.40)] bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]"
            >
                Draft · unsaved
            </Badge>
        );
    }
    if (isPublished) {
        return <Badge variant="default">Published</Badge>;
    }
    return (
        <Badge
            variant="outline"
            className="border-[rgba(212,149,42,0.40)] bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]"
        >
            Draft
        </Badge>
    );
}
