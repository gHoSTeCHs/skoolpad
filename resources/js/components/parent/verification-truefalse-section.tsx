import { CheckCircle2, Eye, XCircle } from 'lucide-react';

interface TrueFalseItem {
    statement: string;
    answer: boolean;
    explanation: string;
}

interface VerificationTrueFalseSectionProps {
    items: TrueFalseItem[];
    responses: (boolean | null)[];
    onRespond: (index: number, answer: boolean) => void;
    revealedIndexes: Set<number>;
    onToggleReveal: (index: number) => void;
}

export function VerificationTrueFalseSection({
    items,
    responses,
    onRespond,
    revealedIndexes,
    onToggleReveal,
}: VerificationTrueFalseSectionProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Eye className="size-3.5" />
                True or False
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
                Read each statement aloud. Your child answers True or False.
            </p>
            <div className="space-y-3">
                {items.map((item, i) => {
                    const answered = responses[i] !== null;
                    const revealed = revealedIndexes.has(i);
                    const isCorrect = answered && responses[i] === item.answer;

                    return (
                        <div key={item.statement} className="rounded-lg border border-border bg-card p-4">
                            <p className="text-sm font-medium text-foreground">
                                &ldquo;{item.statement}&rdquo;
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onRespond(i, true)}
                                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        responses[i] === true
                                            ? 'border-[var(--canopy-600)] bg-[var(--canopy-600)] text-white'
                                            : 'border-border text-foreground hover:bg-muted'
                                    }`}
                                >
                                    True
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onRespond(i, false)}
                                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        responses[i] === false
                                            ? 'border-red-500 bg-red-500 text-white'
                                            : 'border-border text-foreground hover:bg-muted'
                                    }`}
                                >
                                    False
                                </button>
                                {answered && (
                                    <button
                                        type="button"
                                        onClick={() => onToggleReveal(i)}
                                        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        {revealed ? 'Hide' : 'Reveal'}
                                    </button>
                                )}
                            </div>
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
                                    <div>
                                        <p className="font-semibold">
                                            {isCorrect
                                                ? 'Correct!'
                                                : `Incorrect — answer is ${item.answer ? 'True' : 'False'}`}
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
    );
}
