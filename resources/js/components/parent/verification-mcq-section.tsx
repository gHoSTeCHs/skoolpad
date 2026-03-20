import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface McqItem {
    id: string;
    question_text: string;
    options: { key: string; text: string }[];
    correct_key: string;
}

interface VerificationMcqSectionProps {
    items: McqItem[];
    responses: Record<string, string>;
    onSelect: (questionId: string, selectedKey: string) => void;
}

export function VerificationMcqSection({ items, responses, onSelect }: VerificationMcqSectionProps) {
    const [revealedQuestions, setRevealedQuestions] = useState<Set<string>>(new Set());

    if (items.length === 0) {
        return null;
    }

    function toggleReveal(questionId: string) {
        setRevealedQuestions((prev) => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    }

    return (
        <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Can they solve this?
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
                Read the question aloud. Your child answers verbally. Select their answer.
            </p>
            <div className="space-y-4">
                {items.map((item) => {
                    const selectedKey = responses[item.id] ?? null;
                    const answered = selectedKey !== null;
                    const revealed = revealedQuestions.has(item.id);
                    const isCorrect = answered && selectedKey === item.correct_key;

                    return (
                        <div key={item.id} className="rounded-lg border border-border bg-card p-4">
                            <p className="text-sm font-medium text-foreground">{item.question_text}</p>
                            <div className="mt-3 space-y-2">
                                {item.options.map((option) => {
                                    const isSelected = selectedKey === option.key;
                                    const isCorrectOption = option.key === item.correct_key;

                                    let optionClasses =
                                        'w-full rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors';

                                    if (revealed) {
                                        if (isCorrectOption) {
                                            optionClasses +=
                                                ' border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';
                                        } else if (isSelected) {
                                            optionClasses +=
                                                ' border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200';
                                        } else {
                                            optionClasses += ' border-border text-muted-foreground opacity-60';
                                        }
                                    } else if (isSelected) {
                                        optionClasses +=
                                            ' border-[var(--canopy-600)] bg-[var(--canopy-50)] text-foreground dark:bg-[var(--canopy-950)]';
                                    } else {
                                        optionClasses += ' border-border text-foreground hover:bg-muted';
                                    }

                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => onSelect(item.id, option.key)}
                                            disabled={revealed}
                                            className={optionClasses}
                                        >
                                            <span className="font-semibold">{option.key}.</span> {option.text}
                                        </button>
                                    );
                                })}
                            </div>
                            {answered && (
                                <div className="mt-3 flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => toggleReveal(item.id)}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        {revealed ? 'Hide' : 'Reveal'}
                                    </button>
                                </div>
                            )}
                            {revealed && (
                                <div
                                    className={`mt-3 flex items-start gap-2 rounded-md p-3 text-xs ${
                                        isCorrect
                                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                            : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                                    }`}
                                >
                                    {isCorrect ? (
                                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    ) : (
                                        <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    )}
                                    <p className="font-semibold">
                                        {isCorrect
                                            ? 'Correct!'
                                            : `Incorrect — correct answer is ${item.correct_key}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
