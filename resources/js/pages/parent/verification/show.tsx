import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Eye, MessageSquare, XCircle } from 'lucide-react';
import { useState } from 'react';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/ParentDashboard/ParentDashboardController';
import { index as verificationIndex, store } from '@/actions/App/Http/Controllers/ParentDashboard/VerificationController';
import ParentLayout from '@/layouts/parent-layout';

interface TrueFalseItem {
    statement: string;
    answer: boolean;
    explanation: string;
}

interface VerificationKit {
    topic_id: string;
    topic_title: string;
    parent_briefing: string | null;
    key_concepts: string[];
    true_false: TrueFalseItem[];
    explain_prompt: string | null;
}

interface VerificationShowProps {
    child: { id: string; user: { name: string } };
    kit: VerificationKit;
}

type OverallResult = 'understood' | 'partially_understood' | 'needs_review';

export default function VerificationShow({ child, kit }: VerificationShowProps) {
    const childName = child.user.name.split(' ')[0];

    const [conceptsChecked, setConceptsChecked] = useState<boolean[]>(
        new Array(kit.key_concepts.length).fill(false),
    );
    const [trueFalseAnswers, setTrueFalseAnswers] = useState<(boolean | null)[]>(
        new Array(kit.true_false.length).fill(null),
    );
    const [revealedItems, setRevealedItems] = useState<Set<number>>(new Set());
    const [overallResult, setOverallResult] = useState<OverallResult | null>(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function toggleConcept(index: number) {
        setConceptsChecked((prev) => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    }

    function setTrueFalseAnswer(index: number, answer: boolean) {
        setTrueFalseAnswers((prev) => {
            const next = [...prev];
            next[index] = answer;
            return next;
        });
    }

    function toggleReveal(index: number) {
        setRevealedItems((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }

    function handleSubmit() {
        if (!overallResult) return;
        setSubmitting(true);

        const checkedIndices = conceptsChecked
            .map((checked, i) => (checked ? i : -1))
            .filter((i) => i !== -1);

        router.post(
            store.url({ studentProfile: child.id, topic: kit.topic_id }),
            {
                responses: {
                    explain_checklist: {
                        concepts_checked: checkedIndices,
                        concepts_total: kit.key_concepts.length,
                    },
                    true_false: trueFalseAnswers.map((answer) => ({
                        child_answer: answer ?? false,
                    })),
                },
                overall_result: overallResult,
                notes: notes || null,
            },
            {
                onFinish: () => setSubmitting(false),
            },
        );
    }

    const resultOptions: { value: OverallResult; label: string; color: string; activeColor: string }[] = [
        { value: 'understood', label: 'Understood', color: 'border-border hover:border-[var(--canopy-400)]', activeColor: 'border-[var(--canopy-600)] bg-[var(--canopy-50)] text-[var(--canopy-700)] dark:bg-[var(--canopy-950)] dark:text-[var(--canopy-300)]' },
        { value: 'partially_understood', label: 'Partially', color: 'border-border hover:border-amber-400', activeColor: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
        { value: 'needs_review', label: 'Needs Review', color: 'border-border hover:border-red-400', activeColor: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
    ];

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: dashboardIndex.url() },
            { title: 'Verification', href: verificationIndex.url(child.id) },
            { title: kit.topic_title, href: '#' },
        ]}>
            <Head title={`Verify — ${kit.topic_title}`} />

            <div className="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
                {/* Back link + header */}
                <div>
                    <Link
                        href={verificationIndex.url(child.id)}
                        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to queue
                    </Link>
                    <h1 className="font-display text-2xl font-bold text-foreground">{kit.topic_title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Verify {childName}&apos;s understanding
                    </p>
                </div>

                {/* Parent briefing */}
                {kit.parent_briefing && (
                    <div className="rounded-lg border border-[var(--canopy-200)] bg-[var(--canopy-50)] p-4 dark:border-[var(--canopy-800)] dark:bg-[var(--canopy-950)]">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--canopy-600)]">
                            What to listen for
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">{kit.parent_briefing}</p>
                    </div>
                )}

                {/* Section 1: Explain */}
                {kit.explain_prompt && (
                    <section>
                        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <MessageSquare className="size-3.5" />
                            Ask them to explain
                        </h2>
                        <div className="rounded-lg border border-border bg-card p-4">
                            <p className="text-sm font-medium leading-relaxed text-foreground">
                                &ldquo;{kit.explain_prompt}&rdquo;
                            </p>
                            {kit.key_concepts.length > 0 && (
                                <div className="mt-4">
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        Tap concepts {childName} mentioned:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {kit.key_concepts.map((concept, i) => (
                                            <button
                                                key={concept}
                                                type="button"
                                                onClick={() => toggleConcept(i)}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                                    conceptsChecked[i]
                                                        ? 'border-[var(--canopy-600)] bg-[var(--canopy-600)] text-white'
                                                        : 'border-border bg-card text-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {conceptsChecked[i] && <span className="mr-1">✓</span>}
                                                {concept}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Section 2: True or False */}
                {kit.true_false.length > 0 && (
                    <section>
                        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Eye className="size-3.5" />
                            True or False
                        </h2>
                        <div className="space-y-3">
                            {kit.true_false.map((item, i) => {
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
                                                onClick={() => setTrueFalseAnswer(i, true)}
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
                                                onClick={() => setTrueFalseAnswer(i, false)}
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
                                                        {isCorrect ? 'Correct!' : `Incorrect — answer is ${item.answer ? 'True' : 'False'}`}
                                                    </p>
                                                    <p className="mt-0.5 opacity-80">{item.explanation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Section 3: Overall Assessment */}
                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Overall Assessment
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                        {resultOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setOverallResult(opt.value)}
                                className={`rounded-lg border-2 px-3 py-3 text-center text-sm font-semibold transition-colors ${
                                    overallResult === opt.value ? opt.activeColor : opt.color
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes about the session..."
                        rows={3}
                        maxLength={2000}
                        className="mt-4 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--canopy-400)] focus:outline-none focus:ring-1 focus:ring-[var(--canopy-400)]"
                    />

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!overallResult || submitting}
                        className="mt-4 w-full rounded-lg bg-[var(--canopy-600)] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50 sm:w-auto sm:px-8"
                    >
                        {submitting ? 'Submitting...' : 'Submit Verification'}
                    </button>
                </section>
            </div>
        </ParentLayout>
    );
}
