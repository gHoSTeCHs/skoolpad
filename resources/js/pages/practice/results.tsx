import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

import PracticeController from '@/actions/App/Http/Controllers/Student/PracticeController';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PracticeResultsPageProps } from '@/types/practice';

import { ScoreSummary } from './partials/score-summary';
import { TopicBreakdown } from './partials/topic-breakdown';

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
        label: 'Answered',
        dot: 'bg-blue-400',
        text: 'text-blue-600 dark:text-blue-400 reader:text-blue-400',
        bg: 'bg-blue-50/50 dark:bg-blue-950/20 reader:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-800/50 reader:border-blue-800/50',
    },
} as const;

function getQuestionStatus(q: QuestionItem) {
    if (q.was_skipped) return STATUS_CONFIG.skipped;
    if (q.is_correct === true) return STATUS_CONFIG.correct;
    if (q.is_correct === false) return STATUS_CONFIG.incorrect;
    return STATUS_CONFIG.ungraded;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

function formatMcqAnswer(data: Record<string, unknown> | null): string | null {
    if (!data) return null;
    const label = (data as { selected_label?: string }).selected_label
        ?? (data as { correct_label?: string }).correct_label;
    return label ?? null;
}

export default function PracticeResults({ session, perQuestion, perTopic }: PracticeResultsPageProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

    const filteredQuestions = perQuestion.filter((q) => {
        if (filter === 'all') return true;
        if (filter === 'correct') return q.is_correct === true;
        if (filter === 'incorrect') return q.is_correct === false;
        return q.was_skipped;
    });

    const correctCount = perQuestion.filter((q) => q.is_correct === true).length;
    const incorrectCount = perQuestion.filter((q) => q.is_correct === false).length;
    const skippedCount = perQuestion.filter((q) => q.was_skipped).length;

    function toggleExpanded(questionId: string) {
        setExpandedId((prev) => (prev === questionId ? null : questionId));
    }

    return (
        <>
            <Head title="Practice Results" />

            <div className="min-h-screen bg-background">
                <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
                        <h1 className="font-display text-lg font-bold tracking-tight">Session Results</h1>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={PracticeController.configure.url()}>New Practice</Link>
                        </Button>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
                    <ScoreSummary session={session} />

                    <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Correct" value={correctCount} color="text-emerald-600 dark:text-emerald-400 reader:text-emerald-400" />
                        <StatCard label="Incorrect" value={incorrectCount} color="text-destructive" />
                        <StatCard label="Skipped" value={skippedCount} color="text-yellow-600 dark:text-yellow-400 reader:text-yellow-400" />
                    </div>

                    {perTopic.length > 0 && (
                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="font-display text-base font-semibold tracking-tight">Topic Performance</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Accuracy by topic across graded questions
                            </p>
                            <div className="mt-4">
                                <TopicBreakdown topics={perTopic} />
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-base font-semibold tracking-tight">Question Review</h2>
                            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {filteredQuestions.length} of {perQuestion.length}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {([
                                { key: 'all', label: 'All', count: perQuestion.length },
                                { key: 'correct', label: 'Correct', count: correctCount },
                                { key: 'incorrect', label: 'Incorrect', count: incorrectCount },
                                { key: 'skipped', label: 'Skipped', count: skippedCount },
                            ] as const).map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    onClick={() => setFilter(f.key)}
                                    className={cn(
                                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                        filter === f.key
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                                    )}
                                >
                                    {f.label} ({f.count})
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 space-y-2">
                            {filteredQuestions.map((q, i) => {
                                const originalIndex = perQuestion.indexOf(q);
                                const status = getQuestionStatus(q);
                                const isExpanded = expandedId === q.question_id;

                                return (
                                    <div key={q.question_id} className={cn('overflow-hidden rounded-xl border transition-colors', isExpanded ? status.border : 'border-border')}>
                                        <button
                                            type="button"
                                            onClick={() => toggleExpanded(q.question_id)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                                        >
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                                                {originalIndex + 1}
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
                                                    <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
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
                                                                <ContentRenderer content={q.quick_answer as unknown as string} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {filteredQuestions.length === 0 && (
                                <div className="rounded-xl border border-dashed py-10 text-center">
                                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                        No questions match this filter.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="flex items-center justify-center gap-3 pb-8 pt-2">
                        <Button variant="outline" asChild>
                            <Link href={PracticeController.configure.url()}>Practice Again</Link>
                        </Button>
                    </div>
                </main>
            </div>
        </>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="rounded-xl border bg-card px-4 py-3 text-center">
            <span className={cn('font-display text-xl font-bold tabular-nums', color)}>{value}</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{label}</p>
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

function stripHtml(html: string): string {
    if (typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
