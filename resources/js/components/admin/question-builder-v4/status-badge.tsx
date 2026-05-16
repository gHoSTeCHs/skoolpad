import { router } from '@inertiajs/react';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { QuestionStatus } from '@/types/questions';

const STATUS_ORDER: QuestionStatus[] = ['draft', 'in_review', 'published', 'archived'];

const STATUS_LABEL: Record<QuestionStatus, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    published: 'Published',
    archived: 'Archived',
};

const STATUS_CLASS: Record<QuestionStatus, string> = {
    draft: 'bg-[var(--bg-raised)] text-muted-foreground border border-border',
    in_review: 'bg-[var(--honey-soft)] text-[var(--honey)] border border-[var(--honey-line)]',
    published: 'bg-primary/10 text-primary border border-primary/30',
    archived: 'bg-muted text-muted-foreground border border-border line-through decoration-from-font',
};

interface StatusBadgeProps {
    questionId: string;
    status: QuestionStatus;
}

export function StatusBadge({ questionId, status }: StatusBadgeProps) {
    const [pending, setPending] = useState(false);

    function changeStatus(next: QuestionStatus) {
        if (next === status || pending) return;
        setPending(true);
        router.put(
            QuestionController.update.url(questionId),
            { status: next },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onFinish: () => setPending(false),
            },
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={pending}
                    aria-label={`Status: ${STATUS_LABEL[status]} (click to change)`}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity',
                        STATUS_CLASS[status],
                        pending && 'opacity-50',
                    )}
                >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {STATUS_LABEL[status]}
                    <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[170px]">
                {STATUS_ORDER.map((s) => {
                    const isCurrent = s === status;
                    return (
                        <DropdownMenuItem
                            key={s}
                            onSelect={() => changeStatus(s)}
                            disabled={isCurrent || pending}
                            className="flex items-center justify-between gap-2"
                        >
                            <span className="text-[12.5px]">{STATUS_LABEL[s]}</span>
                            {isCurrent && <Check className="h-3.5 w-3.5 text-primary" aria-hidden />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
