import type { QuestionType, ResponseConfig } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

export interface QuestionFormData {
    /**
     * Sent on every partial PUT so the backend's ResponseConfigValidator
     * can dispatch to the right per-type rule (mcq vs theory vs matching, ...).
     * Not user-editable from the editor column.
     */
    question_type: QuestionType;
    marks: number | '';
    difficulty_level: string;
    bloom_level: string;
    content: string;
    content_doc: TiptapJSON | null;
    response_config: ResponseConfig;
    [key: string]: string | number | TiptapJSON | ResponseConfig | null;
}

/**
 * Narrow bridge passed from the parent useForm holder into individual section
 * components. Sections only need to read field values, write them, and surface
 * server-side validation errors — no need to expose the whole useForm surface.
 */
export interface QuestionFormBridge {
    data: QuestionFormData;
    errors: Partial<Record<keyof QuestionFormData, string>>;
    setField: <K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) => void;
}

export function deriveContentDoc(text: string): TiptapJSON {
    const trimmed = text.trim();
    return {
        type: 'doc',
        content: [
            trimmed
                ? { type: 'paragraph', content: [{ type: 'text', text: trimmed }] }
                : { type: 'paragraph' },
        ],
    };
}
