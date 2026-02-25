import type { ShowcaseQuestion } from '@/components/skoolpad/questions';
import type {
    AssertionReasonConfig,
    CalculationConfig,
    ClozeConfig,
    DiagramLabelConfig,
    FillBlankConfig,
    MatchingConfig,
    MatrixMatchingConfig,
    McqConfig,
    NumericEntryConfig,
    OrderingConfig,
    QuestionFormData,
    ResponseConfig,
    TrueFalseConfig,
} from '@/types/questions';

/**
 * Converts QuestionFormData (from the form state) into a ShowcaseQuestion
 * shape suitable for the QuestionRenderer preview component.
 */
export function formDataToShowcaseQuestion(data: QuestionFormData): ShowcaseQuestion {
    const base: ShowcaseQuestion = {
        number: '1',
        displayLabel: 'Q1',
        type: data.question_type,
        content: data.content,
        marks: data.marks === '' ? null : (data.marks as number),
        children: [],
    };

    if (!data.response_config) {
        return base;
    }

    return {
        ...base,
        ...extractTypePreview(data.question_type, data.response_config),
    };
}

function extractTypePreview(
    type: string,
    config: ResponseConfig,
): Partial<ShowcaseQuestion> {
    switch (type) {
        case 'mcq':
        case 'multi_select_mcq': {
            const mcq = config as McqConfig;
            if (!mcq.options?.length) return {};
            return {
                options: mcq.options
                    .filter((opt) => opt.text)
                    .map((opt) => ({
                        label: opt.label,
                        text: opt.text,
                        isCorrect: opt.is_correct,
                    })),
            };
        }
        case 'true_false': {
            const tf = config as TrueFalseConfig;
            return {
                trueFalseAnswer: tf.correct_answer,
                requiresJustification: tf.requires_justification,
            };
        }
        case 'fill_blank': {
            const fb = config as FillBlankConfig;
            if (!fb.blanks?.length) return {};
            return {
                fillBlanks: fb.blanks.flatMap((b) => b.correct_answers),
            };
        }
        case 'cloze': {
            const cloze = config as ClozeConfig;
            if (!cloze.gaps?.length) return {};
            return {
                gapOptions: cloze.gaps.map((g) => ({
                    position: g.position,
                    options: g.options,
                    correct: g.correct,
                })),
            };
        }
        case 'matching': {
            const m = config as MatchingConfig;
            if (!m.pairs?.length) return {};
            return {
                matchingPairs: m.pairs.map((p) => ({ left: p.left, right: p.right })),
                matchingDistractors: m.distractors,
            };
        }
        case 'matrix_matching': {
            const mm = config as MatrixMatchingConfig;
            if (!mm.left?.length || !mm.right?.length) return {};
            return {
                matrixLeft: mm.left,
                matrixRight: mm.right,
                matrixMapping: mm.mapping,
            };
        }
        case 'ordering': {
            const o = config as OrderingConfig;
            if (!o.items?.length) return {};
            return {
                orderItems: o.items,
                correctOrder: o.correct_order,
            };
        }
        case 'diagram_label': {
            const dl = config as DiagramLabelConfig;
            if (!dl.labels?.length) return {};
            return {
                diagramLabels: dl.labels.map((l) => ({ label: l.label, answer: l.answer })),
            };
        }
        case 'calculation': {
            const c = config as CalculationConfig;
            return {
                calculationAnswer: c.answer,
                calculationUnit: c.unit,
            };
        }
        case 'numeric_entry': {
            const ne = config as NumericEntryConfig;
            return {
                numericAnswer: ne.answer,
                numericTolerance: ne.tolerance,
                numericUnit: ne.unit,
            };
        }
        case 'assertion_reason': {
            const ar = config as AssertionReasonConfig;
            return {
                assertion: ar.assertion,
                reason: ar.reason,
                options: ar.options
                    ?.filter((opt) => opt.text)
                    .map((opt) => ({
                        label: opt.label,
                        text: opt.text,
                        isCorrect: opt.is_correct,
                    })),
            };
        }
        default:
            return {};
    }
}
