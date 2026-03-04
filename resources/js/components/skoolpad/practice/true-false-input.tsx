import { Check, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { TrueFalseConfig } from '@/types/questions';

interface TrueFalseInputProps {
    responseConfig: TrueFalseConfig;
    onSubmit: (data: { answer: boolean; justification?: string }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { correct_answer?: boolean } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { answer: boolean; justification?: string } | null;
}

export function TrueFalseInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: TrueFalseInputProps) {
    const requiresJustification = responseConfig?.requires_justification ?? false;
    const [selected, setSelected] = useState<boolean | null>(existingAnswer?.answer ?? null);
    const [justification, setJustification] = useState<string>(existingAnswer?.justification ?? '');
    const isSubmitted = !!feedback || !!readOnly;

    function handleSelect(value: boolean) {
        if (isSubmitted) return;
        setSelected(value);
    }

    function handleSubmit() {
        if (selected === null || isSubmitted) return;
        const data: { answer: boolean; justification?: string } = { answer: selected };
        if (requiresJustification && justification.trim()) {
            data.justification = justification.trim();
        }
        onSubmit(data);
    }

    function getEffectiveSelected(): boolean | null {
        if (existingAnswer !== undefined && existingAnswer !== null && 'answer' in existingAnswer) {
            return existingAnswer.answer;
        }
        return selected;
    }

    function getCardStyle(value: boolean) {
        const effectiveSelected = getEffectiveSelected();
        const isChosen = effectiveSelected === value;

        if (!feedback && !readOnly) {
            return isChosen
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/40 hover:bg-accent/50';
        }

        const correctAnswer = feedback?.correctAnswer?.correct_answer;
        const isCorrectOption = correctAnswer === value;

        if (isChosen && isCorrectOption) {
            return 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400';
        }
        if (isChosen && !isCorrectOption) {
            return 'border-destructive bg-destructive/10 text-destructive';
        }
        if (!isChosen && isCorrectOption) {
            return 'border-emerald-500 opacity-70';
        }
        return 'border-border opacity-50';
    }

    function getIconStyle(value: boolean) {
        const effectiveSelected = getEffectiveSelected();
        const isChosen = effectiveSelected === value;

        if (!feedback && !readOnly) {
            return isChosen ? 'text-primary' : 'text-muted-foreground';
        }

        const correctAnswer = feedback?.correctAnswer?.correct_answer;
        const isCorrectOption = correctAnswer === value;

        if (isChosen && isCorrectOption) return 'text-emerald-600 dark:text-emerald-400';
        if (isChosen && !isCorrectOption) return 'text-destructive';
        if (!isChosen && isCorrectOption) return 'text-emerald-600 dark:text-emerald-400';
        return 'text-muted-foreground';
    }

    const effectiveSelected = getEffectiveSelected();
    const canSubmit = selected !== null && !isSubmitted;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {([true, false] as const).map((value) => (
                    <button
                        key={String(value)}
                        type="button"
                        onClick={() => handleSelect(value)}
                        disabled={isSubmitted}
                        className={cn(
                            'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all',
                            getCardStyle(value),
                            !isSubmitted && 'cursor-pointer',
                        )}
                    >
                        <span className={cn('flex items-center justify-center', getIconStyle(value))}>
                            {value ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                        </span>
                        <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>
                            {value ? 'True' : 'False'}
                        </span>
                    </button>
                ))}
            </div>

            {requiresJustification && effectiveSelected !== null && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Justification
                    </label>
                    <textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        disabled={isSubmitted}
                        rows={3}
                        placeholder="Explain your reasoning..."
                        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                        style={{ fontFamily: 'var(--font-content)' }}
                    />
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
