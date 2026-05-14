import type { QuestionNode, QuestionType } from '@/types/questions';

export const DRAFT_QUESTION_ID = '';

/**
 * A synthetic, unsaved QuestionNode used to render the Question tab in draft
 * mode. id is the empty string — useEditorForm / useQuestionForm branch on it
 * to POST (create) instead of PUT (update).
 */
export function buildDraftQuestion(defaultType: QuestionType): QuestionNode {
    return {
        id: DRAFT_QUESTION_ID,
        question_type: defaultType,
        content: '',
        content_doc: null,
        marks: null,
        response_config: null,
        status: 'draft',
        sort_order: 0,
        depth_level: 0,
        children: [],
    } as unknown as QuestionNode;
}

export function isDraftQuestion(question: QuestionNode): boolean {
    return question.id === DRAFT_QUESTION_ID;
}
