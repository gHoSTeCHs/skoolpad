import { useState } from 'react';

import { ContentRenderer } from '@/components/shared/content-renderer';
import type { PracticeQuestionData } from '@/types/practice';

import { QuestionAnswerInput } from './question-answer-input';

interface GroupRendererProps {
    children: PracticeQuestionData['children'];
    onSubmit: (data: { group_answers: Record<string, Record<string, unknown>> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: Record<string, unknown> | null } | null;
    readOnly?: boolean;
    existingAnswer?: { group_answers: Record<string, Record<string, unknown>> } | null;
}

export function GroupRenderer({ children, onSubmit, feedback, readOnly, existingAnswer }: GroupRendererProps) {
    const [childAnswers, setChildAnswers] = useState<Record<string, Record<string, unknown>>>(
        existingAnswer?.group_answers ?? {},
    );
    const isSubmitted = !!feedback || !!readOnly;
    const allAnswered = children.every((child) => childAnswers[child.id] !== undefined);

    function handleChildAnswer(childId: string, data: Record<string, unknown>) {
        setChildAnswers((prev) => ({ ...prev, [childId]: data }));
    }

    return (
        <div className="space-y-6">
            {children.map((child, index) => {
                const childFeedback = feedback?.correctAnswer
                    ? {
                        isCorrect: feedback.isCorrect,
                        correctAnswer: ((feedback.correctAnswer as Record<string, Record<string, unknown>>)?.children?.[child.id] ?? null) as Record<string, unknown> | null,
                    }
                    : feedback ? { isCorrect: feedback.isCorrect, correctAnswer: null } : null;

                const childMediaUrl = child.contexts?.find((c) => c.context_type === 'diagram')?.media_url ?? null;

                return (
                    <div key={child.id} className="rounded-lg border border-border/60 p-4">
                        <div className="mb-3 flex items-start gap-2">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                {index + 1}
                            </span>
                            <div className="prose prose-sm dark:prose-invert reader:prose-invert max-w-none" style={{ fontFamily: 'var(--font-content)' }}>
                                <ContentRenderer content={child.content} />
                            </div>
                        </div>
                        <QuestionAnswerInput
                            questionType={child.question_type}
                            responseConfig={child.response_config}
                            onSubmit={(data) => handleChildAnswer(child.id, data)}
                            feedback={childFeedback}
                            readOnly={isSubmitted}
                            existingAnswer={
                                (existingAnswer?.group_answers?.[child.id] ?? childAnswers[child.id]) as Record<string, unknown> | null
                            }
                            mediaUrl={childMediaUrl}
                        />
                    </div>
                );
            })}
            {!isSubmitted && allAnswered && (
                <button
                    type="button"
                    onClick={() => onSubmit({ group_answers: childAnswers })}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                >
                    Submit All
                </button>
            )}
        </div>
    );
}
