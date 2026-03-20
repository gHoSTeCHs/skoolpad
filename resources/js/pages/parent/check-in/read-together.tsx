import { Head, router } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Eye, MessageSquare, XCircle } from 'lucide-react';
import { useState } from 'react';
import ParentLayout from '@/layouts/parent-layout';

interface TrueFalseItem {
    statement: string;
    answer: boolean;
    explanation: string;
}

interface VerificationKitShape {
    key_concepts?: string[];
    true_false?: TrueFalseItem[];
    explain_prompt?: string | null;
    parent_briefing?: string | null;
}

interface ReadTogetherProps {
    child: { id: string; name: string };
    content: {
        topic_id: string;
        topic_title: string;
        content: Record<string, unknown> | null;
        verification_kit: VerificationKitShape | null;
    };
}

type Step = 'read' | 'explain' | 'verify' | 'result';

const steps: { key: Step; label: string }[] = [
    { key: 'read', label: 'Read' },
    { key: 'explain', label: 'Explain' },
    { key: 'verify', label: 'Check' },
    { key: 'result', label: 'Rate' },
];

export default function ReadTogether({ child, content }: ReadTogetherProps) {
    const [currentStep, setCurrentStep] = useState<Step>('read');
    const kit = content.verification_kit;
    const trueFalseItems = kit?.true_false ?? [];

    const [trueFalseAnswers, setTrueFalseAnswers] = useState<(boolean | null)[]>(
        new Array(trueFalseItems.length).fill(null),
    );
    const [revealedItems, setRevealedItems] = useState<Set<number>>(new Set());
    const [overallResult, setOverallResult] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
    const childFirstName = child.name.split(' ')[0];

    function setAnswer(index: number, answer: boolean) {
        setTrueFalseAnswers((prev) => {
            const next = [...prev];
            next[index] = answer;
            return next;
        });
    }

    function toggleReveal(index: number) {
        setRevealedItems((prev) => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        });
    }

    function handleSubmit() {
        if (!overallResult) return;
        setSubmitting(true);

        router.post(
            `/parent/children/${child.id}/verification/${content.topic_id}`,
            {
                responses: {
                    explain_checklist: {
                        concepts_checked: [],
                        concepts_total: kit?.key_concepts?.length ?? 0,
                    },
                    true_false: trueFalseAnswers.map((answer) => ({
                        child_answer: answer ?? false,
                    })),
                },
                overall_result: overallResult,
                notes: 'Read Together session',
            },
            { onFinish: () => setSubmitting(false) },
        );
    }

    const resultOptions = [
        { value: 'understood', label: 'Got it!', color: 'border-border hover:border-[var(--canopy-400)]', activeColor: 'border-[var(--canopy-600)] bg-[var(--canopy-50)] text-[var(--canopy-700)] dark:bg-[var(--canopy-950)] dark:text-[var(--canopy-300)]' },
        { value: 'partially_understood', label: 'Mostly', color: 'border-border hover:border-amber-400', activeColor: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
        { value: 'needs_review', label: 'Needs more work', color: 'border-border hover:border-red-400', activeColor: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
    ];

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: '/parent/dashboard' },
            { title: 'Read Together', href: '#' },
        ]}>
            <Head title={`Read Together — ${content.topic_title}`} />

            <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2">
                    {steps.map((step, i) => (
                        <div key={step.key} className="flex items-center gap-2">
                            <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                i <= currentStepIndex
                                    ? 'bg-[var(--canopy-600)] text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {i + 1}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`h-0.5 w-6 rounded ${
                                    i < currentStepIndex ? 'bg-[var(--canopy-400)]' : 'bg-muted'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Read */}
                {currentStep === 'read' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <BookOpen className="mx-auto size-8 text-[var(--canopy-600)]" />
                            <h1 className="mt-3 font-display text-2xl font-bold text-foreground">
                                {content.topic_title}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Read this topic aloud to {childFirstName}. Take about 5 minutes.
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-6">
                            {content.content ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--canopy-600)]">
                                        <BookOpen className="size-4" />
                                        Topic content available
                                    </div>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Read through the topic content with {childFirstName}. Pause at key points
                                        and ask if they have questions. Take your time.
                                    </p>
                                    {kit?.parent_briefing && (
                                        <div className="mt-3 rounded-lg bg-[var(--canopy-50)] p-3 text-sm text-foreground dark:bg-[var(--canopy-950)]">
                                            <p className="mb-1 text-xs font-semibold text-[var(--canopy-600)]">Key points to cover:</p>
                                            <p className="leading-relaxed">{kit.parent_briefing}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No written content available for this topic. Use your child&apos;s textbook or
                                    notes to review the material together.
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setCurrentStep('explain')}
                            className="w-full rounded-lg bg-[var(--canopy-600)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] sm:w-auto sm:px-8"
                        >
                            Done Reading →
                        </button>
                    </div>
                )}

                {/* Step 2: Explain */}
                {currentStep === 'explain' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <MessageSquare className="mx-auto size-8 text-[var(--canopy-600)]" />
                            <h2 className="mt-3 font-display text-xl font-bold text-foreground">
                                Ask {childFirstName} to Explain
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Listen for about 2 minutes. Don&apos;t correct them yet.
                            </p>
                        </div>

                        {kit?.explain_prompt ? (
                            <div className="rounded-xl border-l-4 border-l-[var(--canopy-400)] border-y border-r border-border bg-card p-5">
                                <p className="text-sm font-medium leading-relaxed text-foreground">
                                    &ldquo;{kit.explain_prompt}&rdquo;
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border bg-card p-5">
                                <p className="text-sm text-muted-foreground">
                                    Ask {childFirstName} to explain what they just learned in their own words.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentStep('read')}
                                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(trueFalseItems.length > 0 ? 'verify' : 'result')}
                                className="rounded-lg bg-[var(--canopy-600)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)]"
                            >
                                {trueFalseItems.length > 0 ? 'Next: Quick Check →' : 'Next: Rate →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Verify (True/False) */}
                {currentStep === 'verify' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <Eye className="mx-auto size-8 text-[var(--canopy-600)]" />
                            <h2 className="mt-3 font-display text-xl font-bold text-foreground">Quick Check</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Read each statement aloud. {childFirstName} answers True or False.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {trueFalseItems.map((item, i) => {
                                const answered = trueFalseAnswers[i] !== null;
                                const revealed = revealedItems.has(i);
                                const isCorrect = answered && trueFalseAnswers[i] === item.answer;

                                return (
                                    <div key={item.statement} className="rounded-lg border border-border bg-card p-4">
                                        <p className="text-sm font-medium text-foreground">
                                            &ldquo;{item.statement}&rdquo;
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setAnswer(i, true)}
                                                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                    trueFalseAnswers[i] === true
                                                        ? 'border-[var(--canopy-600)] bg-[var(--canopy-600)] text-white'
                                                        : 'border-border text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                True
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAnswer(i, false)}
                                                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                    trueFalseAnswers[i] === false
                                                        ? 'border-red-500 bg-red-500 text-white'
                                                        : 'border-border text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                False
                                            </button>
                                            {answered && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleReveal(i)}
                                                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    {revealed ? 'Hide' : 'Reveal'}
                                                </button>
                                            )}
                                        </div>
                                        {revealed && (
                                            <div className={`mt-3 flex items-start gap-2 rounded-md p-3 text-xs ${
                                                isCorrect
                                                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                                    : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                                            }`}>
                                                {isCorrect
                                                    ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                                                    : <XCircle className="mt-0.5 size-3.5 shrink-0" />
                                                }
                                                <div>
                                                    <p className="font-semibold">
                                                        {isCorrect ? 'Correct!' : `Answer: ${item.answer ? 'True' : 'False'}`}
                                                    </p>
                                                    <p className="mt-0.5 opacity-80">{item.explanation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentStep('explain')}
                                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep('result')}
                                className="rounded-lg bg-[var(--canopy-600)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)]"
                            >
                                Next: Rate Understanding →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Result */}
                {currentStep === 'result' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="font-display text-xl font-bold text-foreground">
                                How did {childFirstName} do?
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Based on the reading and check, how well does {childFirstName} understand this topic?
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {resultOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setOverallResult(opt.value)}
                                    className={`rounded-lg border-2 px-3 py-4 text-center text-sm font-semibold transition-colors ${
                                        overallResult === opt.value ? opt.activeColor : opt.color
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(trueFalseItems.length > 0 ? 'verify' : 'explain')}
                                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!overallResult || submitting}
                                className="rounded-lg bg-[var(--canopy-600)] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Done'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ParentLayout>
    );
}
