import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { AssertionReasonConfig } from '@/types/questions';

interface AssertionReasonInputProps {
    responseConfig: AssertionReasonConfig;
    onSubmit: (data: { selected: string }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { correct_label?: string } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { selected: string } | null;
}

export function AssertionReasonInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: AssertionReasonInputProps) {
    const options = responseConfig?.options ?? [];
    const [selectedLabel, setSelectedLabel] = useState<string | null>(existingAnswer?.selected ?? null);
    const isSubmitted = !!feedback || !!readOnly;

    function handleSelect(label: string) {
        if (isSubmitted) return;
        setSelectedLabel(label);
    }

    function handleSubmit() {
        if (!selectedLabel || isSubmitted) return;
        onSubmit({ selected: selectedLabel });
    }

    function getEffectiveSelected(): string | null {
        if (existingAnswer?.selected !== undefined) return existingAnswer.selected;
        return selectedLabel;
    }

    function getOptionStyle(option: { label: string; is_correct: boolean }) {
        if (!feedback && !readOnly) {
            return selectedLabel === option.label
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/40 hover:bg-accent/50';
        }

        const effectiveSelected = getEffectiveSelected();
        const studentSelected = effectiveSelected === option.label;
        const correctLabel = feedback?.correctAnswer?.correct_label;
        const isCorrectOption = correctLabel ? option.label === correctLabel : option.is_correct;

        if (isCorrectOption) {
            return 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400';
        }
        if (studentSelected && !isCorrectOption) {
            return 'border-destructive bg-destructive/10 text-destructive';
        }
        return 'border-border opacity-50';
    }

    function getLabelBadgeStyle(option: { label: string; is_correct: boolean }) {
        if (!feedback && !readOnly) {
            return selectedLabel === option.label ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';
        }

        const effectiveSelected = getEffectiveSelected();
        const studentSelected = effectiveSelected === option.label;
        const correctLabel = feedback?.correctAnswer?.correct_label;
        const isCorrectOption = correctLabel ? option.label === correctLabel : option.is_correct;

        if (isCorrectOption) return 'bg-emerald-500 text-white';
        if (studentSelected) return 'bg-destructive text-white';
        return 'bg-muted text-muted-foreground';
    }

    const canSubmit = !!selectedLabel && !isSubmitted;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="rounded-r-lg border-l-4 border-primary bg-accent/30 py-3 pl-4 pr-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary" style={{ fontFamily: 'var(--font-body)' }}>
                        Assertion
                    </p>
                    <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-content)' }}>
                        {responseConfig?.assertion}
                    </p>
                </div>

                <div className="rounded-r-lg border-l-4 border-muted-foreground/40 bg-accent/20 py-3 pl-4 pr-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Reason
                    </p>
                    <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: 'var(--font-content)' }}>
                        {responseConfig?.reason}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Select the option that best describes the relationship between the assertion and reason
                </p>
                {options.map((option) => (
                    <button
                        key={option.label}
                        type="button"
                        onClick={() => handleSelect(option.label)}
                        disabled={isSubmitted}
                        className={cn(
                            'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all',
                            getOptionStyle(option),
                            !isSubmitted && 'cursor-pointer',
                        )}
                    >
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', getLabelBadgeStyle(option))}>
                            {option.label}
                        </span>
                        <span className="pt-0.5 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                            {option.text}
                        </span>
                    </button>
                ))}
            </div>

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
