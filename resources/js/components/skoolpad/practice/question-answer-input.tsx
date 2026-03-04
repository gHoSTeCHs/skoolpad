import type {
    AssertionReasonConfig,
    CalculationConfig,
    ClozeConfig,
    DiagramLabelConfig,
    FillBlankConfig,
    MatchingConfig,
    MatrixMatchingConfig,
    McqConfig,
    MultiSelectMcqConfig,
    NumericEntryConfig,
    OrderingConfig,
    QuestionType,
    ResponseConfig,
    TrueFalseConfig,
} from '@/types/questions';

import { AssertionReasonInput } from './assertion-reason-input';
import { CalculationInput } from './calculation-input';
import { ClozeInput } from './cloze-input';
import { DiagramLabelInput } from './diagram-label-input';
import { EssayInput } from './essay-input';
import { FillBlankInput } from './fill-blank-input';
import { MatchingInput } from './matching-input';
import { MatrixMatchingInput } from './matrix-matching-input';
import { McqInput } from './mcq-input';
import { MultiSelectInput } from './multi-select-input';
import { NumericEntryInput } from './numeric-entry-input';
import { OrderingInput } from './ordering-input';
import { ShortAnswerInput } from './short-answer-input';
import { TheoryInput } from './theory-input';
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

        case 'ordering':
            if (!responseConfig) return null;
            return (
                <OrderingInput
                    responseConfig={responseConfig as OrderingConfig}
                    onSubmit={onSubmit as (data: { order: number[] }) => void}
                    feedback={
                        feedback
                            ? {
                                  isCorrect: feedback.isCorrect,
                                  correctAnswer: {
                                      correct_order: (feedback.correctAnswer as { correct_order?: number[] })?.correct_order,
                                      items: (feedback.correctAnswer as { items?: string[] })?.items,
                                  },
                              }
                            : null
                    }
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { order: number[] } | null}
                />
            );

        case 'matching':
            if (!responseConfig) return null;
            return (
                <MatchingInput
                    responseConfig={responseConfig as MatchingConfig}
                    onSubmit={onSubmit as (data: { pairs: Record<string, number> }) => void}
                    feedback={
                        feedback
                            ? {
                                  isCorrect: feedback.isCorrect,
                                  correctAnswer: {
                                      pairs: (feedback.correctAnswer as { pairs?: { left: string; right: string }[] })?.pairs,
                                  },
                              }
                            : null
                    }
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { pairs: Record<string, number> } | null}
                />
            );

        case 'fill_blank':
            if (!responseConfig) return null;
            return (
                <FillBlankInput
                    responseConfig={responseConfig as FillBlankConfig}
                    onSubmit={onSubmit as (data: { blanks: Record<string, string> }) => void}
                    feedback={
                        feedback
                            ? {
                                  isCorrect: feedback.isCorrect,
                                  correctAnswer: {
                                      blanks: (feedback.correctAnswer as { blanks?: { position: number; correct_answers: string[] }[] })?.blanks,
                                  },
                              }
                            : null
                    }
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { blanks: Record<string, string> } | null}
                />
            );

        case 'cloze':
            if (!responseConfig) return null;
            return (
                <ClozeInput
                    responseConfig={responseConfig as ClozeConfig}
                    onSubmit={onSubmit as (data: { gaps: Record<string, number> }) => void}
                    feedback={
                        feedback
                            ? {
                                  isCorrect: feedback.isCorrect,
                                  correctAnswer: {
                                      gaps: (feedback.correctAnswer as { gaps?: { position: number; options: string[]; correct: number }[] })?.gaps,
                                  },
                              }
                            : null
                    }
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { gaps: Record<string, number> } | null}
                />
            );

        case 'short_answer':
            return (
                <ShortAnswerInput
                    onSubmit={onSubmit as (data: { text: string }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: null } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { text: string } | null}
                />
            );

        case 'theory':
            return (
                <TheoryInput
                    onSubmit={onSubmit as (data: { text: string }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: null } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { text: string } | null}
                />
            );

        case 'essay':
            return (
                <EssayInput
                    onSubmit={onSubmit as (data: { text: string }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: null } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { text: string } | null}
                />
            );

        case 'calculation':
            return (
                <CalculationInput
                    responseConfig={responseConfig as CalculationConfig | null}
                    onSubmit={onSubmit as (data: { answer: string; unit?: string; working?: string }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: null } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { answer: string; unit?: string; working?: string } | null}
                />
            );

        case 'diagram_label':
            if (!responseConfig) return null;
            return (
                <DiagramLabelInput
                    responseConfig={responseConfig as DiagramLabelConfig}
                    onSubmit={onSubmit as (data: { labels: Record<string, string> }) => void}
                    feedback={feedback ? { isCorrect: feedback.isCorrect, correctAnswer: { labels: (feedback.correctAnswer as { labels?: { label: string; answer: string }[] })?.labels } } : null}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { labels: Record<string, string> } | null}
                />
            );

        case 'matrix_matching':
            if (!responseConfig) return null;
            return (
                <MatrixMatchingInput
                    responseConfig={responseConfig as MatrixMatchingConfig}
                    onSubmit={onSubmit as (data: { matches: Record<string, number[]> }) => void}
                    feedback={
                        feedback
                            ? {
                                  isCorrect: feedback.isCorrect,
                                  correctAnswer: {
                                      mapping: (feedback.correctAnswer as { mapping?: Record<number, number[]> })?.mapping,
                                      left: (feedback.correctAnswer as { left?: string[] })?.left,
                                      right: (feedback.correctAnswer as { right?: string[] })?.right,
                                  },
                              }
                            : null
                    }
                    readOnly={readOnly}
                    existingAnswer={existingAnswer as { matches: Record<string, number[]> } | null}
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
