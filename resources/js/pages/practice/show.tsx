import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PracticeController from '@/actions/App/Http/Controllers/Student/PracticeController';
import { Button } from '@/components/ui/button';
import { modeLabels } from '@/lib/practice';
import { cn } from '@/lib/utils';
import type { AnswerSubmissionResponse, PracticeAnswerData, PracticeShowPageProps } from '@/types/practice';

import { ProgressBar } from './partials/progress-bar';
import { QuestionDisplay } from './partials/question-display';
import { QuestionGrid } from './partials/question-grid';
import { TimerDisplay } from './partials/timer-display';

export default function PracticeShow({ session, questions, answers: serverAnswers, currentIndex: initialIndex }: PracticeShowPageProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [localAnswers, setLocalAnswers] = useState<Record<string, PracticeAnswerData>>(serverAnswers);
    const [currentFeedback, setCurrentFeedback] = useState<AnswerSubmissionResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [prevIndex, setPrevIndex] = useState<number | null>(null);
    const [savedVisible, setSavedVisible] = useState(false);
    const questionStartTime = useRef(Date.now());
    const isTimed = session.mode === 'timed' && session.time_limit_seconds !== null;
    const elapsed = Object.values(serverAnswers).reduce((sum, a) => sum + (a.time_spent_seconds ?? 0), 0);
    const timerInitialSeconds = isTimed ? Math.max(0, session.time_limit_seconds! - elapsed) : 0;
    const isReviewMode = session.mode === 'review';

    const currentQuestion = questions[currentIndex];
    const existingAnswer = currentQuestion ? localAnswers[currentQuestion.id] ?? null : null;
    const totalAnswered = Object.keys(localAnswers).length;
    const allAnswered = totalAnswered >= questions.length;

    const persistedContextIds = useMemo(() => {
        if (prevIndex === null || prevIndex === currentIndex) return [];
        const isSequential = Math.abs(currentIndex - prevIndex) === 1;
        if (!isSequential) return [];

        const prevContextIds = new Set(questions[prevIndex]?.contexts.map((c) => c.id) ?? []);
        const currentContextIds = currentQuestion?.contexts.map((c) => c.id) ?? [];
        return currentContextIds.filter((id) => prevContextIds.has(id));
    }, [prevIndex, currentIndex, questions, currentQuestion]);

    useEffect(() => {
        if (!savedVisible) return;
        const timer = setTimeout(() => setSavedVisible(false), 2000);
        return () => clearTimeout(timer);
    }, [savedVisible]);

    const getCsrfToken = useCallback((): string => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    }, []);

    function navigateTo(index: number) {
        if (index < 0 || index >= questions.length) return;
        setPrevIndex(currentIndex);
        setCurrentIndex(index);
        setCurrentFeedback(null);
        questionStartTime.current = Date.now();
        setShowGrid(false);
    }

    function handleSubmitAnswer(data: Record<string, unknown>) {
        if (submitting || !currentQuestion) return;

        const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
        setSubmitting(true);

        fetch(PracticeController.answer.url(session.id), {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({
                question_id: currentQuestion.id,
                response_data: data,
                selected_label: (data as { selected_label?: string }).selected_label ?? null,
                time_spent_seconds: timeSpent,
                sequence_order: currentIndex,
                was_skipped: false,
            }),
        })
            .then((r) => {
                if (!r.ok) throw new Error('Answer submission failed');
                return r.json();
            })
            .then((response: AnswerSubmissionResponse) => {
                setCurrentFeedback(response);
                setSavedVisible(true);

                setLocalAnswers((prev) => {
                    const updated = {
                        ...prev,
                        [currentQuestion.id]: {
                            id: crypto.randomUUID(),
                            question_id: currentQuestion.id,
                            selected_option_label: (data as { selected_label?: string }).selected_label ?? null,
                            response_data: data,
                            is_correct: response.is_correct,
                            time_spent_seconds: timeSpent,
                            was_skipped: false,
                            sequence_order: currentIndex,
                        },
                    };

                    if (isReviewMode && Object.keys(updated).length >= questions.length) {
                        setTimeout(() => router.post(PracticeController.complete.url(session.id)), 1500);
                    }

                    return updated;
                });
            })
            .catch(() => {})
            .finally(() => setSubmitting(false));
    }

    function handleSkip() {
        if (submitting || !currentQuestion) return;

        const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
        setSubmitting(true);

        fetch(PracticeController.answer.url(session.id), {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({
                question_id: currentQuestion.id,
                response_data: {},
                time_spent_seconds: timeSpent,
                sequence_order: currentIndex,
                was_skipped: true,
            }),
        })
            .then((r) => {
                if (!r.ok) throw new Error('Skip submission failed');
                return r.json();
            })
            .then(() => {
                setSavedVisible(true);
                setLocalAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                        id: crypto.randomUUID(),
                        question_id: currentQuestion.id,
                        selected_option_label: null,
                        response_data: null,
                        is_correct: null,
                        time_spent_seconds: timeSpent,
                        was_skipped: true,
                        sequence_order: currentIndex,
                    },
                }));

                if (currentIndex < questions.length - 1) {
                    navigateTo(currentIndex + 1);
                }
            })
            .catch(() => {})
            .finally(() => setSubmitting(false));
    }

    function handleNext() {
        if (currentIndex < questions.length - 1) {
            navigateTo(currentIndex + 1);
        }
    }

    function handlePrev() {
        if (currentIndex > 0) {
            navigateTo(currentIndex - 1);
        }
    }

    function handleEndSession() {
        setShowEndConfirm(true);
    }

    function confirmEndSession() {
        router.post(PracticeController.complete.url(session.id));
    }

    function handleTimeUp() {
        router.post(PracticeController.complete.url(session.id));
    }

    return (
        <>
            <Head title={`Practice — Q${currentIndex + 1} of ${questions.length}`} />

            <div className="flex min-h-screen flex-col bg-background">
                <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                                Question {currentIndex + 1}
                                <span className="text-muted-foreground"> of {questions.length}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {modeLabels[session.mode] ?? session.mode}
                            </span>
                            {savedVisible && (
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 reader:text-emerald-400 transition-opacity" style={{ fontFamily: 'var(--font-body)' }}>
                                    Saved ✓
                                </span>
                            )}
                            {isTimed && (
                                <TimerDisplay
                                    totalSeconds={timerInitialSeconds}
                                    onTimeUp={handleTimeUp}
                                    isRunning={!session.completed_at}
                                />
                            )}
                            <Button variant="outline" size="sm" onClick={handleEndSession}>
                                End Session
                            </Button>
                        </div>
                    </div>
                    <div className="mx-auto max-w-4xl px-4 pb-2">
                        <ProgressBar questions={questions} answers={localAnswers} />
                    </div>
                </header>

                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
                    {currentQuestion && (
                        <QuestionDisplay
                            question={currentQuestion}
                            onSubmit={handleSubmitAnswer}
                            onSkip={handleSkip}
                            feedback={currentFeedback}
                            readOnly={!!existingAnswer}
                            existingAnswer={existingAnswer}
                            persistedContextIds={persistedContextIds}
                        />
                    )}
                </main>

                <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
                        <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentIndex === 0}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                            </svg>
                            Previous
                        </Button>

                        <button
                            type="button"
                            onClick={() => setShowGrid(!showGrid)}
                            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {totalAnswered}/{questions.length} answered
                        </button>

                        {existingAnswer || currentFeedback ? (
                            currentIndex < questions.length - 1 ? (
                                <Button size="sm" onClick={handleNext}>
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                        <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </Button>
                            ) : (
                                <Button size="sm" onClick={handleEndSession}>
                                    Finish
                                </Button>
                            )
                        ) : (
                            <Button variant="ghost" size="sm" onClick={handleSkip}>
                                Skip
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                    <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                </svg>
                            </Button>
                        )}
                    </div>
                </footer>

                {showGrid && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                        <div className="fixed inset-0 bg-black/40" onClick={() => setShowGrid(false)} />
                        <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-background p-6 shadow-xl sm:rounded-2xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-body)' }}>Questions</h3>
                                <button type="button" onClick={() => setShowGrid(false)} className="text-muted-foreground hover:text-foreground">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                        <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                                    </svg>
                                </button>
                            </div>
                            <QuestionGrid
                                questions={questions}
                                answers={localAnswers}
                                currentIndex={currentIndex}
                                onSelect={navigateTo}
                            />
                            {allAnswered && (
                                <Button className="mt-4 w-full" onClick={handleEndSession}>
                                    Finish Session
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {showEndConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="fixed inset-0 bg-black/40" onClick={() => setShowEndConfirm(false)} />
                        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
                            <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-body)' }}>End Session?</h3>
                            <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {allAnswered
                                    ? 'You have answered all questions. Ready to see your results?'
                                    : `You have answered ${totalAnswered} of ${questions.length} questions. Unanswered questions will not be scored.`
                                }
                            </p>
                            <div className="mt-4 flex gap-3 justify-end">
                                <Button variant="outline" size="sm" onClick={() => setShowEndConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={confirmEndSession}>
                                    {allAnswered ? 'See Results' : 'End Session'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
