import type { AssertionReasonConfig, McqConfig, MultiSelectMcqConfig, NumericEntryConfig, QuestionType, ResponseConfig, TrueFalseConfig } from '@/types/questions';

import { AssertionReasonInput } from './assertion-reason-input';
import { McqInput } from './mcq-input';
import { MultiSelectInput } from './multi-select-input';
import { NumericEntryInput } from './numeric-entry-input';
import { TrueFalseInput } from './true-false-input';

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

    if (questionType === 'multi_select_mcq' && responseConfig) {
        return (
            <MultiSelectInput
                responseConfig={responseConfig as MultiSelectMcqConfig}
                onSubmit={onSubmit}
                feedback={feedback}
                readOnly={readOnly}
                existingAnswer={existingAnswer}
            />
        );
    }

    if (questionType === 'true_false' && responseConfig) {
        return (
            <TrueFalseInput
                responseConfig={responseConfig as TrueFalseConfig}
                onSubmit={onSubmit}
                feedback={feedback}
                readOnly={readOnly}
                existingAnswer={existingAnswer}
            />
        );
    }

    if (questionType === 'numeric_entry' && responseConfig) {
        return (
            <NumericEntryInput
                responseConfig={responseConfig as NumericEntryConfig}
                onSubmit={onSubmit}
                feedback={feedback}
                readOnly={readOnly}
                existingAnswer={existingAnswer}
            />
        );
    }

    if (questionType === 'assertion_reason' && responseConfig) {
        return (
            <AssertionReasonInput
                responseConfig={responseConfig as AssertionReasonConfig}
                onSubmit={onSubmit}
                feedback={feedback}
                readOnly={readOnly}
                existingAnswer={existingAnswer}
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
