import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { DiagramLabelConfig } from '@/types/questions';

interface DiagramLabelInputProps {
    responseConfig: DiagramLabelConfig;
    onSubmit: (data: { labels: Record<string, string> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { labels?: { label: string; answer: string }[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { labels: Record<string, string> } | null;
    mediaUrl?: string | null;
}

export function DiagramLabelInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer, mediaUrl }: DiagramLabelInputProps) {
    const labels = responseConfig?.labels ?? [];
    const isSubmitted = !!feedback || !!readOnly;

    const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
        if (existingAnswer?.labels) return existingAnswer.labels;
        return {};
    });

    const canSubmit = labels.every((_, i) => {
        const key = `hotspot_${i}`;
        return (userAnswers[key] ?? '').trim().length > 0;
    });

    function handleChange(key: string, value: string) {
        if (isSubmitted) return;
        setUserAnswers((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit() {
        if (!canSubmit || isSubmitted) return;
        const result: Record<string, string> = {};
        labels.forEach((_, i) => {
            const key = `hotspot_${i}`;
            result[key] = (userAnswers[key] ?? '').trim();
        });
        onSubmit({ labels: result });
    }

    function isCorrect(key: string): boolean {
        if (!feedback) return false;
        const index = Number(key.replace('hotspot_', ''));
        const correctLabel = feedback.correctAnswer?.labels?.[index];
        if (!correctLabel) return false;
        const studentVal = (existingAnswer?.labels ?? userAnswers)[key] ?? '';
        return studentVal.toLowerCase().trim() === correctLabel.answer.toLowerCase().trim();
    }

    function inputStyle(key: string): string {
        if (!isSubmitted) {
            return 'border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none';
        }
        return isCorrect(key)
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'border-destructive bg-destructive/10';
    }

    return (
        <div className="space-y-3">
            {mediaUrl && (
                <div className="overflow-hidden rounded-md border border-border bg-muted/30">
                    <img
                        src={mediaUrl}
                        alt="Diagram to label"
                        className="mx-auto max-h-[400px] w-auto object-contain"
                    />
                </div>
            )}

            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Label each part of the diagram
            </p>

            <div className="space-y-3">
                {labels.map((labelItem, i) => {
                    const key = `hotspot_${i}`;
                    const currentValue = (existingAnswer?.labels ?? userAnswers)[key] ?? '';
                    const correctLabelItem = feedback?.correctAnswer?.labels?.[i];

                    return (
                        <div key={key} className="flex items-start gap-3">
                            <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {i + 1}
                            </span>
                            <div className="flex-1 space-y-1">
                                {labelItem.label && (
                                    <p className="text-xs text-muted-foreground">{labelItem.label}</p>
                                )}
                                <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    disabled={isSubmitted}
                                    placeholder={`Label ${i + 1}`}
                                    className={cn(
                                        'w-full rounded-md border px-3 py-2 text-sm transition-colors',
                                        inputStyle(key),
                                        isSubmitted && 'cursor-default',
                                    )}
                                    style={{ fontFamily: 'var(--font-content)' }}
                                />
                                {isSubmitted && !isCorrect(key) && correctLabelItem && (
                                    <p className="text-xs text-muted-foreground">
                                        Correct: <span className="font-medium text-emerald-600 dark:text-emerald-400">{correctLabelItem.answer}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!isSubmitted && canSubmit && (
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
