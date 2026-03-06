import { Badge } from '@/components/ui/badge';
import { cn, stripHtml } from '@/lib/utils';
import type { ReviewQueueItem, ReviewStrength } from '@/types/student-review-queue';

const strengthConfig: Record<ReviewStrength, { label: string; className: string }> = {
    weak: {
        label: 'Weak',
        className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400 reader:border-red-800/50 reader:bg-red-950/40 reader:text-red-400',
    },
    growing: {
        label: 'Growing',
        className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400 reader:border-amber-800/50 reader:bg-amber-950/40 reader:text-amber-400',
    },
    strong: {
        label: 'Strong',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400 reader:border-emerald-800/50 reader:bg-emerald-950/40 reader:text-emerald-400',
    },
};

export default function QueueItem({ item }: { item: ReviewQueueItem }) {
    const config = strengthConfig[item.strength];
    const snippet = item.question_content ? stripHtml(item.question_content) : 'Question content unavailable';
    const truncated = snippet.length > 120 ? snippet.slice(0, 120) + '…' : snippet;

    return (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30">
            <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {truncated}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {item.course_code && (
                        <span className="text-[11px] font-medium text-muted-foreground">{item.course_code}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground/60">·</span>
                    <span className="text-[11px] text-muted-foreground">
                        {item.interval_days === 1 ? 'Every day' : `Every ${item.interval_days} days`}
                    </span>
                </div>
            </div>
            <Badge variant="outline" className={cn('shrink-0 text-[10px]', config.className)}>
                {config.label}
            </Badge>
        </div>
    );
}
