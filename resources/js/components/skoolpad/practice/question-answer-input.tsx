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
    switch (questionType) {
        case 'mcq':
            if (!responseConfig) return null;
            return (
                <McqInput
                    responseConfig={responseConfig as McqConfig}
                    onSubmit={onSubmit as (data: { selected_label: string }) => void}
                    feedback={feedback ? { isCorrect: !!feedback.isCorrect, correctLabel: (feedback.correctAnswer as { correct_label?: string })?.correct_label ?? '' } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { selected_label: string } | null}
                />
            );

        case 'multi_select_mcq':
            if (!responseConfig) return null;
            return (
                <MultiSelectInput
                    responseConfig={responseConfig as MultiSelectMcqConfig}
                    onSubmit={onSubmit as (data: { selected_labels: string[] }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: { correct_labels: (feedback.correctAnswer as { correct_labels?: string[] })?.correct_labels } } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { selected_labels: string[] } | null}
                />
            );

        case 'true_false':
            if (!responseConfig) return null;
            return (
                <TrueFalseInput
                    responseConfig={responseConfig as TrueFalseConfig}
                    onSubmit={onSubmit as (data: { answer: boolean; justification?: string }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: { correct_answer: (feedback.correctAnswer as { correct_answer?: boolean })?.correct_answer } } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { answer: boolean; justification?: string } | null}
                />
            );

        case 'numeric_entry':
            if (!responseConfig) return null;
            return (
                <NumericEntryInput
                    responseConfig={responseConfig as NumericEntryConfig}
                    onSubmit={onSubmit as (data: { value: number; unit?: string }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: { answer: (feedback.correctAnswer as { answer?: number })?.answer, tolerance: (feedback.correctAnswer as { tolerance?: number })?.tolerance, unit: (feedback.correctAnswer as { unit?: string | null })?.unit } } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { value: number; unit?: string } | null}
                />
            );

        case 'assertion_reason':
            if (!responseConfig) return null;
            return (
                <AssertionReasonInput
                    responseConfig={responseConfig as AssertionReasonConfig}
                    onSubmit={onSubmit as (data: { selected: string }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: { correct_label: (feedback.correctAnswer as { correct_label?: string })?.correct_label } } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { selected: string } | null}
                />
            );

        default:
            return (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        This question type ({questionType}) is not yet supported for practice.
                    </p>
                </div>
            );
    }
}
