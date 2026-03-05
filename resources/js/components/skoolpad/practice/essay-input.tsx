import { useState } from 'react';

import { cn } from '@/lib/utils';

interface EssayInputProps {
    responseConfig?: null;
    onSubmit: (data: { text: string }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: null } | null;
    readOnly?: boolean;
    existingAnswer?: { text: string } | null;
}

function countWords(text: string): number {
    const trimmed = text.trim();
    if (trimmed === '') return 0;
    return trimmed.split(/\s+/).length;
}

export function EssayInput({ onSubmit, feedback, readOnly, existingAnswer }: EssayInputProps) {
    const [answer, setAnswer] = useState<string>(existingAnswer?.text ?? '');
    const isSubmitted = !!feedback || !!readOnly;
    const canSubmit = answer.trim() !== '' && !isSubmitted;
    const wordCount = countWords(isSubmitted && existingAnswer?.text !== undefined ? existingAnswer.text : answer);

    function handleSubmit() {
        if (!canSubmit) return;
        onSubmit({ text: answer.trim() });
    }

    const displayValue = isSubmitted && existingAnswer?.text !== undefined ? existingAnswer.text : answer;

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                {isSubmitted ? (
                    <div
                        className="min-h-[144px] rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground whitespace-pre-wrap"
                        style={{ fontFamily: 'var(--font-content)' }}
                    >
                        {displayValue}
                    </div>
                ) : (
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={6}
                        placeholder="Write your essay here"
                        className={cn(
                            'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 resize-y',
                            'border-border',
                        )}
                        style={{ fontFamily: 'var(--font-content)' }}
                    />
                )}
                <p className="text-right text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </p>
            </div>

            {isSubmitted && (
                <div className="mt-3 rounded-md border border-amber-400/60 bg-amber-50/60 px-4 py-3 dark:bg-amber-900/20 reader:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 reader:text-amber-400">
                        Answer submitted — grading not available in this version.
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
