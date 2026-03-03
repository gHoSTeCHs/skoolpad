import type { McqConfig, QuestionType, ResponseConfig } from '@/types/questions';

import { McqInput } from './mcq-input';

interface QuestionAnswerInputProps {
    questionType: QuestionType;
    responseConfig: ResponseConfig;
    onSubmit: (data: Record<string, unknown>) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: Record<string, unknown> | null } | null;
    readOnly?: boolean;
    existingAnswer?: Record<string, unknown> | null;
}

export function QuestionAnswerInput({ questionType, responseConfig, onSubmit, feedback, readOnly, existingAnswer }: QuestionAnswerInputProps) {
    if (questionType === 'mcq' && responseConfig) {
        return (
            <McqInput
                responseConfig={responseConfig as McqConfig}
                onSubmit={onSubmit}
                feedback={feedback ? {
                    isCorrect: !!feedback.isCorrect,
                    correctLabel: (feedback.correctAnswer as { correct_label?: string })?.correct_label ?? '',
                } : null}
                readOnly={readOnly}
                existingAnswer={existingAnswer as { selected_label: string } | null}
            />
        );
    }

    return (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                This question type ({questionType}) is not yet supported for practice.
            </p>
        </div>
    );
}
