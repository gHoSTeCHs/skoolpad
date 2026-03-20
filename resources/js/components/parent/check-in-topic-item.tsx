import { Link } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Clock, Eye, ShieldCheck } from 'lucide-react';
import type { CheckInItem } from '@/types/parent';

interface CheckInTopicItemProps {
    item: CheckInItem;
    childId: string;
    isCompleted: boolean;
}

const typeConfig = {
    verification: {
        label: 'Verify',
        icon: ShieldCheck,
        color: 'text-[var(--canopy-600)] bg-[var(--canopy-50)] dark:bg-[var(--canopy-950)]',
    },
    weak_area_review: {
        label: 'Review',
        icon: Eye,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
    },
    topic_preview: {
        label: 'Preview',
        icon: BookOpen,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    },
    scheme_alignment: {
        label: 'Coverage',
        icon: CheckCircle2,
        color: 'text-muted-foreground bg-muted',
    },
} as const;

export function CheckInTopicItem({ item, childId, isCompleted }: CheckInTopicItemProps) {
    const config = typeConfig[item.type] ?? typeConfig.scheme_alignment;
    const Icon = config.icon;
    const isLinkable = item.type === 'verification' || item.type === 'weak_area_review';

    const content = (
        <div className={`flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors ${isLinkable ? 'hover:bg-muted' : ''} ${isCompleted ? 'opacity-60' : ''}`}>
            <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${config.color}`}>
                {isCompleted ? (
                    <CheckCircle2 className="size-4 text-[var(--canopy-600)]" />
                ) : (
                    <Icon className="size-4" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.topic_title}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.color}`}>
                        {config.label}
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>~{item.estimated_minutes} min</span>
                </div>
                {item.type === 'topic_preview' && item.parent_briefing && (
                    <p className="mt-2 rounded-md bg-muted p-2.5 text-xs leading-relaxed text-muted-foreground">
                        {item.parent_briefing}
                    </p>
                )}
            </div>
        </div>
    );

    if (isLinkable && !isCompleted) {
        return (
            <Link href={`/parent/children/${childId}/verification/${item.canonical_topic_id}`} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
