import { useState } from 'react';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MatrixMatchingConfig } from '@/types/questions';

interface MatrixMatchingInputProps {
    responseConfig: MatrixMatchingConfig;
    onSubmit: (data: { matches: Record<string, number[]> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { mapping?: Record<number, number[]>; left?: string[]; right?: string[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { matches: Record<string, number[]> } | null;
}

export function MatrixMatchingInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: MatrixMatchingInputProps) {
    const leftItems = responseConfig?.left ?? [];
    const rightItems = responseConfig?.right ?? [];
    const isSubmitted = !!feedback || !!readOnly;

    const [checked, setChecked] = useState<Record<string, number[]>>(() => {
        if (existingAnswer?.matches) return existingAnswer.matches;
        return {};
    });

    function toggleCell(leftIndex: number, rightIndex: number) {
        if (isSubmitted) return;
        setChecked((prev) => {
            const current = prev[String(leftIndex)] ?? [];
            const has = current.includes(rightIndex);
            return {
                ...prev,
                [String(leftIndex)]: has
                    ? current.filter((i) => i !== rightIndex)
                    : [...current, rightIndex],
            };
        });
    }

    function handleSubmit() {
        if (isSubmitted) return;
        const matches: Record<string, number[]> = {};
        leftItems.forEach((_, i) => {
            matches[String(i)] = checked[String(i)] ?? [];
        });
        onSubmit({ matches });
    }

    function getCellStyle(leftIndex: number, rightIndex: number): string {
        if (!isSubmitted) return '';
        const correctMapping = feedback?.correctAnswer?.mapping ?? {};
        const correctRight = (correctMapping[leftIndex] ?? []).map(Number);
        const studentRight = (existingAnswer?.matches ?? checked)[String(leftIndex)] ?? [];
        const isCheckedByStudent = studentRight.includes(rightIndex);
        const shouldBeChecked = correctRight.includes(rightIndex);

        if (isCheckedByStudent && shouldBeChecked) return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
        if (isCheckedByStudent && !shouldBeChecked) return 'bg-destructive/20 text-destructive';
        if (!isCheckedByStudent && shouldBeChecked) return 'bg-amber-100 dark:bg-amber-900/20';
        return '';
    }

    return (
        <div className="space-y-3">
            {!isSubmitted && (
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Check all right-column items that match each row
                </p>
            )}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th className="w-1/3 p-2 text-left font-medium text-muted-foreground"></th>
                            {rightItems.map((r, j) => (
                                <th key={j} className="border-b border-border p-2 text-center text-xs font-medium text-muted-foreground">
                                    {r}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {leftItems.map((l, i) => (
                            <tr key={i} className="border-b border-border/40">
                                <td className="p-2 text-sm font-medium" style={{ fontFamily: 'var(--font-content)' }}>
                                    {l}
                                </td>
                                {rightItems.map((_, j) => {
                                    const isCheckedByStudent = ((existingAnswer?.matches ?? checked)[String(i)] ?? []).includes(j);
                                    return (
                                        <td key={j} className={cn('p-2 text-center', getCellStyle(i, j))}>
                                            <button
                                                type="button"
                                                onClick={() => toggleCell(i, j)}
                                                disabled={isSubmitted}
                                                aria-label={`${l} matches ${rightItems[j]}`}
                                                className={cn(
                                                    'mx-auto flex h-5 w-5 items-center justify-center rounded border transition-colors',
                                                    isCheckedByStudent
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border hover:border-primary/60',
                                                    isSubmitted && 'cursor-default',
                                                )}
                                            >
                                                {isCheckedByStudent && <Check className="h-3 w-3" />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!isSubmitted && (
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
