import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { McqConfig } from '@/types/questions';

interface McqInputProps {
    responseConfig: McqConfig;
    onSubmit: (data: { selected_label: string }) => void;
    feedback?: { isCorrect: boolean; correctLabel: string } | null;
    readOnly?: boolean;
    existingAnswer?: { selected_label: string } | null;
}

export function McqInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: McqInputProps) {
    const [selectedLabel, setSelectedLabel] = useState<string | null>(existingAnswer?.selected_label ?? null);
    const options = responseConfig?.options ?? [];
    const isSubmitted = !!feedback || !!readOnly;

    function handleSelect(label: string) {
        if (isSubmitted) return;
        setSelectedLabel(label);
    }

    function handleSubmit() {
        if (!selectedLabel || isSubmitted) return;
        onSubmit({ selected_label: selectedLabel });
    }

    function getOptionStyle(option: { label: string; is_correct: boolean }) {
        if (!feedback && !readOnly) {
            return selectedLabel === option.label
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/40 hover:bg-accent/50';
        }

        if (!feedback) {
            const effectiveSelected = existingAnswer?.selected_label ?? selectedLabel;
            return effectiveSelected === option.label
                ? 'border-primary/40 bg-primary/5 opacity-70'
                : 'border-border opacity-50';
        }

        const studentSelected = (existingAnswer?.selected_label ?? selectedLabel) === option.label;
        const isCorrectOption = option.is_correct;

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
            return selectedLabel === option.label
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground';
        }

        if (!feedback) {
            const effectiveSelected = existingAnswer?.selected_label ?? selectedLabel;
            return effectiveSelected === option.label ? 'bg-primary/40 text-white' : 'bg-muted text-muted-foreground';
        }

        const studentSelected = (existingAnswer?.selected_label ?? selectedLabel) === option.label;
        if (option.is_correct) return 'bg-emerald-500 text-white';
        if (studentSelected) return 'bg-destructive text-white';
        return 'bg-muted text-muted-foreground';
    }

    return (
        <div className="space-y-3">
            <div className="space-y-2">
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

            {!isSubmitted && selectedLabel && (
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
