import { Clock } from 'lucide-react';

import { ContentRenderer } from '@/components/shared/content-renderer';
import { cn, formatDuration, stripHtml } from '@/lib/utils';
import type { PracticeResultsPageProps } from '@/types/practice';
import type { RenderableContent } from '@/types/tiptap';

type QuestionItem = PracticeResultsPageProps['perQuestion'][number];

const STATUS_CONFIG = {
    correct: {
        label: 'Correct',
        dot: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400',
        bg: 'bg-emerald-50/50 dark:bg-emerald-950/20 reader:bg-emerald-950/20',
        border: 'border-emerald-200 dark:border-emerald-800/50 reader:border-emerald-800/50',
    },
    incorrect: {
        label: 'Incorrect',
        dot: 'bg-destructive',
        text: 'text-destructive',
        bg: 'bg-red-50/50 dark:bg-red-950/20 reader:bg-red-950/20',
        border: 'border-red-200 dark:border-red-800/50 reader:border-red-800/50',
    },
    skipped: {
        label: 'Skipped',
        dot: 'bg-yellow-400 dark:bg-yellow-500 reader:bg-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400 reader:text-yellow-400',
        bg: 'bg-yellow-50/50 dark:bg-yellow-950/20 reader:bg-yellow-950/20',
        border: 'border-yellow-200 dark:border-yellow-800/50 reader:border-yellow-800/50',
    },
    ungraded: {
        label: 'Not auto-gradable',
        dot: 'bg-muted-foreground',
        text: 'text-muted-foreground',
        bg: 'bg-muted/50',
        border: 'border-border',
    },
} as const;

export function getQuestionStatus(q: QuestionItem) {
    if (q.was_skipped) return STATUS_CONFIG.skipped;
    if (q.is_correct === true) return STATUS_CONFIG.correct;
    if (q.is_correct === false) return STATUS_CONFIG.incorrect;
    return STATUS_CONFIG.ungraded;
}

function formatMcqAnswer(data: Record<string, unknown> | null): string | null {
    if (!data) return null;
    const label = (data as { selected_label?: string }).selected_label
        ?? (data as { correct_label?: string }).correct_label;
    return label ?? null;
}

interface QuestionReviewRowProps {
    question: QuestionItem;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
}

export function QuestionReviewRow({ question: q, index, isExpanded, onToggle }: QuestionReviewRowProps) {
    const status = getQuestionStatus(q);

    return (
        <div className={cn('overflow-hidden rounded-xl border transition-colors', isExpanded ? status.border : 'border-border')}>
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
            >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        {stripHtml(q.question_content).slice(0, 100)}
                        {stripHtml(q.question_content).length > 100 ? '...' : ''}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {q.time_spent_seconds !== null && (
                        <span className="text-[11px] tabular-nums text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {formatDuration(q.time_spent_seconds)}
                        </span>
                    )}
                    <span className={cn('flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', status.text, status.bg)}>
                        {status === STATUS_CONFIG.ungraded ? (
                            <Clock className="size-3 text-muted-foreground" />
                        ) : (
                            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                        )}
                        {status.label}
                    </span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className={cn('size-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
                    >
                        <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            {isExpanded && (
                <div className={cn('border-t px-4 py-4', status.border)}>
                    <div className="space-y-4">
                        <div className="prose prose-sm dark:prose-invert reader:prose-invert max-w-none" style={{ fontFamily: 'var(--font-content)' }}>
                            <ContentRenderer content={q.question_content} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {!q.was_skipped && q.student_answer && (
                                <AnswerCard
                                    heading="Your Answer"
                                    value={formatMcqAnswer(q.student_answer)}
                                    isCorrect={q.is_correct}
                                />
                            )}
                            {q.correct_answer && (
                                <AnswerCard
                                    heading="Correct Answer"
                                    value={formatMcqAnswer(q.correct_answer)}
                                    isCorrect={true}
                                />
                            )}
                        </div>

                        {q.quick_answer && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30 reader:border-emerald-800 reader:bg-emerald-950/30">
                                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 reader:text-emerald-400" style={{ fontFamily: 'var(--font-body)' }}>
                                    Explanation
                                </p>
                                <div className="text-sm" style={{ fontFamily: 'var(--font-content)' }}>
                                    <ContentRenderer content={q.quick_answer as RenderableContent} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function AnswerCard({ heading, value, isCorrect }: { heading: string; value: string | null; isCorrect: boolean | null }) {
    if (!value) return null;

    const borderColor = isCorrect === true
        ? 'border-emerald-200 dark:border-emerald-800/50 reader:border-emerald-800/50'
        : isCorrect === false
          ? 'border-red-200 dark:border-red-800/50 reader:border-red-800/50'
          : 'border-border';

    return (
        <div className={cn('rounded-lg border p-3', borderColor)}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {heading}
            </p>
            <p className="mt-1 text-sm font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                {value}
            </p>
        </div>
    );
}
