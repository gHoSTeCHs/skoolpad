import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { NumericEntryConfig } from '@/types/questions';

interface NumericEntryInputProps {
    responseConfig: NumericEntryConfig;
    onSubmit: (data: { value: number; unit?: string }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { answer?: number; tolerance?: number; unit?: string | null } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { value: number; unit?: string } | null;
}

export function NumericEntryInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: NumericEntryInputProps) {
    const unit = responseConfig?.unit ?? null;
    const [value, setValue] = useState<string>(existingAnswer?.value !== undefined ? String(existingAnswer.value) : '');
    const isSubmitted = !!feedback || !!readOnly;

    function handleSubmit() {
        if (value.trim() === '' || isSubmitted) return;
        const data: { value: number; unit?: string } = { value: Number(value) };
        if (unit) data.unit = unit;
        onSubmit(data);
    }

    const correctAnswer = feedback?.correctAnswer ?? null;
    const hasCorrectAnswer = correctAnswer !== null && correctAnswer.answer !== undefined;

    function getInputStyle() {
        if (!feedback) return 'border-border focus:border-primary focus:ring-primary/20';
        if (feedback.isCorrect) return 'border-emerald-500 bg-emerald-500/5 focus:border-emerald-500 focus:ring-emerald-500/20';
        return 'border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/20';
    }

    function getFeedbackStyle() {
        if (feedback?.isCorrect) return 'text-emerald-700 dark:text-emerald-400 reader:text-emerald-400';
        return 'text-destructive';
    }

    const displayValue = isSubmitted && existingAnswer?.value !== undefined ? String(existingAnswer.value) : value;
    const canSubmit = value.trim() !== '' && !isNaN(Number(value.trim())) && !isSubmitted;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={displayValue}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={isSubmitted}
                    placeholder="Enter your answer"
                    className={cn(
                        'flex-1 rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 disabled:opacity-60',
                        getInputStyle(),
                    )}
                    style={{ fontFamily: 'var(--font-content)' }}
                />
                {unit && (
                    <span
                        className="shrink-0 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-muted-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        {unit}
                    </span>
                )}
            </div>

            {feedback && hasCorrectAnswer && (
                <div
                    className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm',
                        feedback.isCorrect
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-destructive/30 bg-destructive/5',
                    )}
                >
                    <span className={cn('font-medium', getFeedbackStyle())} style={{ fontFamily: 'var(--font-body)' }}>
                        {feedback.isCorrect ? 'Correct!' : 'Incorrect.'}
                    </span>
                    {!feedback.isCorrect && (
                        <span className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Correct answer:{' '}
                            <span className="font-semibold text-foreground">
                                {correctAnswer!.answer}
                                {correctAnswer!.unit ? ` ${correctAnswer!.unit}` : ''}
                            </span>
                            {correctAnswer!.tolerance !== undefined && correctAnswer!.tolerance !== null && correctAnswer!.tolerance > 0 && (
                                <span className="ml-1 text-xs opacity-70">(±{correctAnswer!.tolerance})</span>
                            )}
                        </span>
                    )}
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
