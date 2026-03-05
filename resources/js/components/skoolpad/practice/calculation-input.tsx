import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { CalculationConfig } from '@/types/questions';

interface CalculationInputProps {
    responseConfig?: CalculationConfig | null;
    onSubmit: (data: { answer: string; unit?: string; working?: string }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: null } | null;
    readOnly?: boolean;
    existingAnswer?: { answer: string; unit?: string; working?: string } | null;
}

export function CalculationInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: CalculationInputProps) {
    const unitLabel = responseConfig?.unit ?? null;

    const [numericAnswer, setNumericAnswer] = useState<string>(existingAnswer?.answer ?? '');
    const [unit, setUnit] = useState<string>(existingAnswer?.unit ?? '');
    const [working, setWorking] = useState<string>(existingAnswer?.working ?? '');

    const isSubmitted = !!feedback || !!readOnly;
    const canSubmit = numericAnswer.trim() !== '' && !isSubmitted;

    function handleSubmit() {
        if (!canSubmit) return;
        const data: { answer: string; unit?: string; working?: string } = { answer: numericAnswer.trim() };
        const resolvedUnit = unitLabel ?? unit.trim();
        if (resolvedUnit) data.unit = resolvedUnit;
        if (working.trim()) data.working = working.trim();
        onSubmit(data);
    }

    const displayAnswer = isSubmitted && existingAnswer?.answer !== undefined ? existingAnswer.answer : numericAnswer;
    const displayUnit = isSubmitted && existingAnswer?.unit !== undefined ? existingAnswer.unit : unit;
    const displayWorking = isSubmitted && existingAnswer?.working !== undefined ? existingAnswer.working : working;

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
                    Answer
                </p>
                <div className="flex items-center gap-2">
                    {isSubmitted ? (
                        <div
                            className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                            style={{ fontFamily: 'var(--font-content)' }}
                        >
                            {displayAnswer}
                        </div>
                    ) : (
                        <input
                            type="text"
                            inputMode="decimal"
                            value={numericAnswer}
                            onChange={(e) => setNumericAnswer(e.target.value)}
                            placeholder="Enter numeric answer"
                            className={cn(
                                'flex-1 rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20',
                                'border-border',
                            )}
                            style={{ fontFamily: 'var(--font-content)' }}
                        />
                    )}

                    {unitLabel ? (
                        <span
                            className="shrink-0 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            {unitLabel}
                        </span>
                    ) : isSubmitted ? (
                        displayUnit ? (
                            <div
                                className="shrink-0 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                                style={{ fontFamily: 'var(--font-content)' }}
                            >
                                {displayUnit}
                            </div>
                        ) : null
                    ) : (
                        <input
                            type="text"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            placeholder="Unit (optional)"
                            className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
                            style={{ fontFamily: 'var(--font-content)' }}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
                    Working / Steps
                </p>
                {isSubmitted ? (
                    <div
                        className="min-h-[72px] rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground whitespace-pre-wrap"
                        style={{ fontFamily: 'var(--font-content)' }}
                    >
                        {displayWorking || <span className="text-muted-foreground italic">No working provided.</span>}
                    </div>
                ) : (
                    <textarea
                        value={working}
                        onChange={(e) => setWorking(e.target.value)}
                        rows={3}
                        placeholder="Show your working or steps (optional)"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 resize-y"
                        style={{ fontFamily: 'var(--font-content)' }}
                    />
                )}
            </div>

            {isSubmitted && (
                <div className="mt-3 rounded-md border border-amber-400/60 bg-amber-50/60 px-4 py-3 dark:bg-amber-900/20 reader:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 reader:text-amber-400">
                        Answer submitted — grading not available in this version.
                    </p>
                </div>
            )}

            {canSubmit && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                >
                    Submit Answer
                </button>
            )}
        </div>
    );
}
