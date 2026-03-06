import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { MultiSelectMcqConfig } from '@/types/questions';

interface MultiSelectInputProps {
    responseConfig: MultiSelectMcqConfig;
    onSubmit: (data: { selected_labels: string[] }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { correct_labels?: string[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { selected_labels: string[] } | null;
}

export function MultiSelectInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: MultiSelectInputProps) {
    const options = responseConfig?.options ?? [];
    const existingSelected = existingAnswer?.selected_labels ?? [];
    const [selectedLabels, setSelectedLabels] = useState<string[]>(existingSelected);
    const isSubmitted = !!feedback || !!readOnly;

    const correctLabels = feedback?.correctAnswer?.correct_labels ?? [];

    function handleToggle(label: string) {
        if (isSubmitted) return;
        setSelectedLabels((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
        );
    }

    function handleSubmit() {
        if (selectedLabels.length === 0 || isSubmitted) return;
        onSubmit({ selected_labels: selectedLabels });
    }

    function getEffectiveSelected(): string[] {
        if (existingAnswer?.selected_labels) return existingAnswer.selected_labels;
        return selectedLabels;
    }

    function getOptionStyle(option: { label: string; is_correct: boolean }) {
        if (!feedback && !readOnly) {
            return selectedLabels.includes(option.label)
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/40 hover:bg-accent/50';
        }

        if (!feedback) {
            const effectiveSelected = getEffectiveSelected();
            return effectiveSelected.includes(option.label)
                ? 'border-primary/40 bg-primary/5 opacity-70'
                : 'border-border opacity-50';
        }

        const effectiveSelected = getEffectiveSelected();
        const studentSelected = effectiveSelected.includes(option.label);
        const isCorrectByBackend = correctLabels.includes(option.label);

        if (isCorrectByBackend && studentSelected) {
            return 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400';
        }
        if (isCorrectByBackend && !studentSelected) {
            return 'border-emerald-500 opacity-70';
        }
        if (studentSelected && !isCorrectByBackend) {
            return 'border-destructive bg-destructive/10 text-destructive';
        }
        return 'border-border opacity-50';
    }

    function getLabelBadgeStyle(option: { label: string; is_correct: boolean }) {
        if (!feedback && !readOnly) {
            return selectedLabels.includes(option.label) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';
        }

        if (!feedback) {
            const effectiveSelected = getEffectiveSelected();
            return effectiveSelected.includes(option.label) ? 'bg-primary/40 text-white' : 'bg-muted text-muted-foreground';
        }

        const effectiveSelected = getEffectiveSelected();
        const studentSelected = effectiveSelected.includes(option.label);
        const isCorrectByBackend = correctLabels.includes(option.label);

        if (isCorrectByBackend) return 'bg-emerald-500 text-white';
        if (studentSelected) return 'bg-destructive text-white';
        return 'bg-muted text-muted-foreground';
    }

    function getCheckboxStyle(option: { label: string; is_correct: boolean }) {
        if (!feedback && !readOnly) {
            return selectedLabels.includes(option.label) ? 'border-primary bg-primary' : 'border-border bg-background';
        }

        if (!feedback) {
            const effectiveSelected = getEffectiveSelected();
            return effectiveSelected.includes(option.label) ? 'border-primary/40 bg-primary/10' : 'border-border bg-background opacity-50';
        }

        const effectiveSelected = getEffectiveSelected();
        const studentSelected = effectiveSelected.includes(option.label);
        const isCorrectByBackend = correctLabels.includes(option.label);

        if (isCorrectByBackend && studentSelected) return 'border-emerald-500 bg-emerald-500';
        if (isCorrectByBackend && !studentSelected) return 'border-emerald-500 bg-background';
        if (studentSelected) return 'border-destructive bg-destructive';
        return 'border-border bg-background';
    }

    const canSubmit = selectedLabels.length > 0 && !isSubmitted;

    return (
        <div className="space-y-3">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Select all that apply
            </p>
            <div className="space-y-2" role="group">
                {options.map((option) => (
                    <button
                        key={option.label}
                        type="button"
                        role="checkbox"
                        aria-checked={selectedLabels.includes(option.label)}
                        onClick={() => handleToggle(option.label)}
                        disabled={isSubmitted}
                        className={cn(
                            'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all',
                            getOptionStyle(option),
                            !isSubmitted && 'cursor-pointer',
                        )}
                    >
                        <span
                            className={cn(
                                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                                getCheckboxStyle(option),
                            )}
                        >
                            {(isSubmitted ? getEffectiveSelected().includes(option.label) : selectedLabels.includes(option.label)) && (
                                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </span>
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
