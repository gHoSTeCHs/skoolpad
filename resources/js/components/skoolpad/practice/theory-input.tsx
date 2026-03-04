import { useState } from 'react';

import { cn } from '@/lib/utils';

interface TheoryInputProps {
    responseConfig?: null;
    onSubmit: (data: { answer: string }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: null } | null;
    readOnly?: boolean;
    existingAnswer?: { answer: string } | null;
}

export function TheoryInput({ onSubmit, feedback, readOnly, existingAnswer }: TheoryInputProps) {
    const [answer, setAnswer] = useState<string>(existingAnswer?.answer ?? '');
    const isSubmitted = !!feedback || !!readOnly;
    const canSubmit = answer.trim() !== '' && !isSubmitted;

    function handleSubmit() {
        if (!canSubmit) return;
        onSubmit({ answer: answer.trim() });
    }

    const displayValue = isSubmitted && existingAnswer?.answer !== undefined ? existingAnswer.answer : answer;

    return (
        <div className="space-y-3">
            {isSubmitted ? (
                <div
                    className="min-h-[72px] rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground whitespace-pre-wrap"
                    style={{ fontFamily: 'var(--font-content)' }}
                >
                    {displayValue}
                </div>
            ) : (
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={3}
                    placeholder="Write your answer here"
                    className={cn(
                        'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 resize-y',
                        'border-border',
                    )}
                    style={{ fontFamily: 'var(--font-content)' }}
                />
            )}

            {isSubmitted && (
                <div className="mt-3 rounded-md border border-amber-400/60 bg-amber-50/60 px-4 py-3 dark:bg-amber-900/20 reader:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 reader:text-amber-400">
                        Answer submitted — teacher grading required.
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
