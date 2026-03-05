import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

import ExamPrepController from '@/actions/App/Http/Controllers/Student/ExamPrepController';
import PracticeController from '@/actions/App/Http/Controllers/Student/PracticeController';
import CourseController from '@/actions/App/Http/Controllers/Student/CourseController';
import ReviewQueueController from '@/actions/App/Http/Controllers/Student/ReviewQueueController';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PracticeResultsPageProps } from '@/types/practice';

import { PredictiveScore } from './partials/predictive-score';
import { QuestionReviewRow, getQuestionStatus } from './partials/question-review-row';
import { ScoreSummary } from './partials/score-summary';
import { SectionBreakdown } from './partials/section-breakdown';
import { TopicBreakdown } from './partials/topic-breakdown';

export default function PracticeResults({ session, perQuestion, perTopic, reviewMetrics, predictiveScore, sectionBreakdown }: PracticeResultsPageProps) {
    const isReviewMode = session.mode === 'review';
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

                    {predictiveScore && <PredictiveScore score={predictiveScore} />}
                    {sectionBreakdown && sectionBreakdown.length > 0 && <SectionBreakdown sections={sectionBreakdown} />}

                    {isReviewMode && reviewMetrics ? (
                        <div className="grid grid-cols-3 gap-3">
                            <StatCard label="Progressed" value={reviewMetrics.progressed} color="text-emerald-600 dark:text-emerald-400 reader:text-emerald-400" />
                            <StatCard label="Reset" value={reviewMetrics.reset} color="text-destructive" />
                            <StatCard label="Graduated" value={reviewMetrics.graduated} color="text-blue-600 dark:text-blue-400 reader:text-blue-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            <StatCard label="Correct" value={correctCount} color="text-emerald-600 dark:text-emerald-400 reader:text-emerald-400" />
                            <StatCard label="Incorrect" value={incorrectCount} color="text-destructive" />
                            <StatCard label="Skipped" value={skippedCount} color="text-yellow-600 dark:text-yellow-400 reader:text-yellow-400" />
                        </div>
                    )}

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
                            {filteredQuestions.map((q) => (
                                <QuestionReviewRow
                                    key={q.question_id}
                                    question={q}
                                    index={perQuestion.indexOf(q)}
                                    isExpanded={expandedId === q.question_id}
                                    onToggle={() => toggleExpanded(q.question_id)}
                                />
                            ))}

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
                        {isReviewMode ? (
                            <>
                                <Button variant="outline" asChild>
                                    <Link href={ReviewQueueController.index.url()}>Back to Dashboard</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                {session.institution_course && (
                                    <Button variant="outline" asChild>
                                        <Link href={CourseController.show.url(session.institution_course.id)}>
                                            Back to Course
                                        </Link>
                                    </Button>
                                )}
                                <Button variant="outline" asChild>
                                    <Link href={ReviewQueueController.index.url()}>View Review Queue</Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={PracticeController.configure.url()}>Practice Again</Link>
                                </Button>
                                {session.mode === 'full_mock' && (
                                    <Button variant="outline" asChild>
                                        <Link href={ExamPrepController.index.url()}>View Exam Prep</Link>
                                    </Button>
                                )}
                                {(() => {
                                    const weakTopics = perTopic.filter((t) => t.accuracy < 70 && t.total > 0);
                                    if (weakTopics.length === 0) return null;
                                    const params = new URLSearchParams();
                                    params.set('institution_course_id', session.institution_course?.id ?? '');
                                    weakTopics.forEach((t) => params.append('topic_ids[]', t.topic_id));
                                    return (
                                        <Button variant="outline" asChild>
                                            <Link href={`${PracticeController.configure.url()}?${params}`}>
                                                Practice Weak Topics ({weakTopics.length})
                                            </Link>
                                        </Button>
                                    );
                                })()}
                            </>
                        )}
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
