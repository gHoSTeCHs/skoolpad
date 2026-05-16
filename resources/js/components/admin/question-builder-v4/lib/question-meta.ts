import type { QuestionType } from '@/types/questions';

export interface TypeMeta {
    /** 3–4 char monospace badge text (e.g. "MCQ", "T/F"). */
    short: string;
    /** Human-readable label for popovers and dropdowns. */
    label: string;
    /** Section-2 anchor label — what the per-type body authors call themselves. */
    bodyAnchorLabel: string;
}

export const TYPE_META: Record<QuestionType, TypeMeta> = {
    mcq: { short: 'MCQ', label: 'Multiple choice', bodyAnchorLabel: 'Options' },
    multi_select_mcq: { short: 'MSC', label: 'Multi-select', bodyAnchorLabel: 'Options' },
    theory: { short: 'THRY', label: 'Theory', bodyAnchorLabel: 'Marking guide' },
    short_answer: { short: 'SANS', label: 'Short answer', bodyAnchorLabel: 'Accepted answers' },
    essay: { short: 'ESSY', label: 'Essay', bodyAnchorLabel: 'Rubric' },
    fill_blank: { short: 'FILL', label: 'Fill blank', bodyAnchorLabel: 'Blanks' },
    cloze: { short: 'CLZ', label: 'Cloze', bodyAnchorLabel: 'Gaps' },
    matching: { short: 'MTCH', label: 'Matching', bodyAnchorLabel: 'Pairs' },
    ordering: { short: 'ORD', label: 'Ordering', bodyAnchorLabel: 'Sequence' },
    true_false: { short: 'T/F', label: 'True / False', bodyAnchorLabel: 'Statement' },
    diagram_label: { short: 'DIAG', label: 'Diagram label', bodyAnchorLabel: 'Diagram + labels' },
    calculation: { short: 'CALC', label: 'Calculation', bodyAnchorLabel: 'Answer + working' },
    assertion_reason: { short: 'A/R', label: 'Assertion-Reason', bodyAnchorLabel: 'Assertion · Reason' },
    matrix_matching: { short: 'MTX', label: 'Matrix matching', bodyAnchorLabel: 'Matrix' },
    numeric_entry: { short: 'NUM', label: 'Numeric entry', bodyAnchorLabel: 'Answer' },
    group: { short: 'GRP', label: 'Group', bodyAnchorLabel: 'Sub-questions' },
};
