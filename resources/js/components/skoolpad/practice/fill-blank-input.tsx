import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { FillBlankConfig } from '@/types/questions';

interface FillBlankInputProps {
    responseConfig: FillBlankConfig;
    onSubmit: (data: { blanks: Record<string, string> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { blanks?: { position: number; correct_answers: string[] }[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { blanks: Record<string, string> } | null;
}

export function FillBlankInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: FillBlankInputProps) {
    const sortedBlanks = [...(responseConfig?.blanks ?? [])].sort((a, b) => a.position - b.position);
    const [answers, setAnswers] = useState<Record<string, string>>(() => existingAnswer?.blanks ?? {});
    const isSubmitted = !!feedback || !!readOnly;

    const canSubmit = !isSubmitted && sortedBlanks.every((b) => (answers[String(b.position)] ?? '').trim() !== '');

    function handleChange(position: number, value: string) {
        if (isSubmitted) return;
        setAnswers((prev) => ({ ...prev, [String(position)]: value }));
    }

    function handleSubmit() {
        if (!canSubmit) return;
        onSubmit({ blanks: answers });
    }

    function isBlankCorrect(position: number): boolean {
        const correctBlanks = feedback?.correctAnswer?.blanks ?? [];
        const blank = correctBlanks.find((b) => b.position === position);
        if (!blank) return false;
        const studentAnswer = (existingAnswer?.blanks ?? answers)[String(position)] ?? '';
        const caseSensitive = responseConfig?.case_sensitive ?? false;
        return blank.correct_answers.some((a) =>
            caseSensitive ? studentAnswer === a : studentAnswer.toLowerCase().trim() === a.toLowerCase().trim(),
        );
    }

    function getCorrectAnswer(position: number): string {
        const correctBlanks = feedback?.correctAnswer?.blanks ?? [];
        const blank = correctBlanks.find((b) => b.position === position);
        return blank?.correct_answers[0] ?? '';
    }

    function getInputStyle(position: number): string {
        if (!isSubmitted) {
            return 'border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';
        }
        if (isBlankCorrect(position)) {
            return 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400 focus:outline-none';
        }
        return 'border-destructive bg-destructive/5 text-destructive focus:outline-none';
    }

    return (
        <div className="space-y-3">
            {sortedBlanks.map((blank, i) => (
                <div key={blank.position} className="flex items-start gap-3">
                    <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                        <input
                            type="text"
                            value={(isSubmitted ? (existingAnswer?.blanks ?? answers) : answers)[String(blank.position)] ?? ''}
                            onChange={(e) => handleChange(blank.position, e.target.value)}
                            disabled={isSubmitted}
                            className={cn('w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60', getInputStyle(blank.position))}
                            placeholder={`Enter answer ${i + 1}`}
                            style={{ fontFamily: 'var(--font-content)' }}
                        />
                        {isSubmitted && !isBlankCorrect(blank.position) && getCorrectAnswer(blank.position) && (
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Correct:{' '}
                                <span className="font-semibold text-foreground">{getCorrectAnswer(blank.position)}</span>
                            </p>
                        )}
                    </div>
                </div>
            ))}

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
