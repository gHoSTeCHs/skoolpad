import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { ClozeConfig } from '@/types/questions';

interface ClozeInputProps {
    responseConfig: ClozeConfig;
    onSubmit: (data: { gaps: Record<string, number> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { gaps?: { position: number; options: string[]; correct: number }[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { gaps: Record<string, number> } | null;
}

export function ClozeInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: ClozeInputProps) {
    const sortedGaps = [...(responseConfig?.gaps ?? [])].sort((a, b) => a.position - b.position);
    const [selections, setSelections] = useState<Record<string, number>>(() => existingAnswer?.gaps ?? {});
    const isSubmitted = !!feedback || !!readOnly;

    const canSubmit = !isSubmitted && sortedGaps.every((g) => (selections[String(g.position)] ?? -1) >= 0);

    function handleChange(position: number, index: number) {
        if (isSubmitted) return;
        setSelections((prev) => ({ ...prev, [String(position)]: index }));
    }

    function handleSubmit() {
        if (!canSubmit) return;
        onSubmit({ gaps: selections });
    }

    function getCorrectGap(position: number): { options: string[]; correct: number } | undefined {
        return (feedback?.correctAnswer?.gaps ?? []).find((g) => g.position === position);
    }

    function isGapCorrect(gap: { position: number; correct: number }): boolean {
        const selected = (existingAnswer?.gaps ?? selections)[String(gap.position)] ?? -1;
        const correctGap = getCorrectGap(gap.position);
        const correctIndex = correctGap !== undefined ? correctGap.correct : gap.correct;
        return selected === correctIndex;
    }

    function getSelectStyle(gap: { position: number; correct: number }): string {
        if (!isSubmitted) {
            const selected = selections[String(gap.position)] ?? -1;
            return selected >= 0
                ? 'border-primary/60 bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                : 'border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';
        }
        if (isGapCorrect(gap)) {
            return 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400 focus:outline-none';
        }
        return 'border-destructive bg-destructive/5 text-destructive focus:outline-none';
    }

    return (
        <div className="space-y-3">
            {sortedGaps.map((gap, i) => {
                const selectedIndex = (isSubmitted ? (existingAnswer?.gaps ?? selections) : selections)[String(gap.position)] ?? -1;
                const correctGap = getCorrectGap(gap.position);
                const correctIndex = correctGap !== undefined ? correctGap.correct : gap.correct;
                const correctOptionText = gap.options[correctIndex] ?? '';

                return (
                    <div key={gap.position} className="flex items-start gap-3">
                        <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {i + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                            <select
                                value={selectedIndex}
                                onChange={(e) => handleChange(gap.position, Number(e.target.value))}
                                disabled={isSubmitted}
                                className={cn(
                                    'w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60',
                                    getSelectStyle(gap),
                                )}
                                style={{ fontFamily: 'var(--font-content)' }}
                            >
                                <option value={-1} disabled>
                                    Select an option...
                                </option>
                                {gap.options.map((opt, idx) => (
                                    <option key={idx} value={idx}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            {isSubmitted && !isGapCorrect(gap) && correctOptionText && (
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    Correct:{' '}
                                    <span className="font-semibold text-foreground">{correctOptionText}</span>
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}

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
