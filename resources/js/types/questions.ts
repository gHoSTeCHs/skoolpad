import type { TiptapJSON } from '@/types/tiptap';

export type QuestionType =
    | 'mcq' | 'multi_select_mcq' | 'theory' | 'short_answer' | 'essay'
    | 'fill_blank' | 'cloze' | 'matching' | 'ordering' | 'true_false'
    | 'diagram_label' | 'calculation' | 'assertion_reason' | 'matrix_matching'
    | 'numeric_entry' | 'group';

export type ContextType =
    | 'passage' | 'diagram' | 'table' | 'case_study' | 'code_snippet'
    | 'map' | 'graph' | 'word_bank' | 'equation_set';

export type QuestionStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionSource = 'manual' | 'crowdsourced' | 'ai_generated' | 'bulk_import' | 'past_paper_imported';
export type AnswerDepthLevel = 'quick' | 'standard' | 'deep_dive';
export type QuestionSemester = 'first' | 'second';

export interface EnumOption<T extends string = string> {
    value: T;
    label: string;
}

export interface McqConfig {
    options: { label: string; text: string; is_correct: boolean }[];
}

export interface MultiSelectMcqConfig extends McqConfig {
    min_correct?: number;
    max_correct?: number;
}

export interface TrueFalseConfig {
    correct_answer: boolean;
    requires_justification?: boolean;
}

export interface FillBlankConfig {
    blanks: { position: number; correct_answers: string[] }[];
    case_sensitive?: boolean;
}

export interface ClozeConfig {
    gaps: { position: number; options: string[]; correct: number }[];
}

export interface MatchingConfig {
    pairs: { left: string; right: string }[];
    distractors?: string[];
}

export interface MatrixMatchingConfig {
    left: string[];
    right: string[];
    mapping: Record<number, number[]>;
}

export interface OrderingConfig {
    items: string[];
    correct_order: number[];
}

export interface DiagramLabelConfig {
    labels: { label: string; answer: string; x?: number; y?: number }[];
}

export interface CalculationConfig {
    answer: string;
    unit?: string;
    tolerance?: number;
    requires_working?: boolean;
}

export interface NumericEntryConfig {
    answer: number;
    tolerance?: number;
    unit?: string;
}

export interface AssertionReasonConfig {
    assertion: string;
    reason: string;
    options: { label: string; text: string; is_correct: boolean }[];
}

export type ResponseConfig =
    | McqConfig | MultiSelectMcqConfig | TrueFalseConfig | FillBlankConfig
    | ClozeConfig | MatchingConfig | MatrixMatchingConfig | OrderingConfig
    | DiagramLabelConfig | CalculationConfig | NumericEntryConfig
    | AssertionReasonConfig | null;

export interface QuestionPaper {
    id: string;
    title: string;
    institution_course_id?: string;
    assessment_type_id?: string;
    academic_session?: string;
    semester?: string;
    year?: number;
    total_marks?: number;
    duration_minutes?: number;
    instructions?: string;
    is_published: boolean;
    sections: QuestionSection[];
    contexts: QuestionContextData[];
    institution_course?: {
        id: string;
        course_code: string;
        course_title: string;
        institution?: { id: string; name: string; abbreviation: string };
    };
    assessment_type?: { id: string; name: string; slug?: string };
}

export interface QuestionSection {
    id: string;
    label: string;
    instruction?: string;
    marks?: number;
    required_count?: number;
    sort_order: number;
    questions: QuestionNode[];
}

export interface QuestionContextData {
    id: string;
    context_type: ContextType;
    title?: string;
    content?: string;
    media_url?: string;
    table_data?: { headers: string[]; rows: string[][] };
    word_bank?: string[];
    language?: string;
}

export interface QuestionNode {
    id: string;
    question_type: QuestionType;
    question_section_id?: string | null;
    question_number?: string;
    display_label?: string;
    content: string;
    content_doc?: TiptapJSON | null;
    marks: number | null;
    sort_order: number;
    depth_level: number;
    response_config: ResponseConfig;
    choice_group?: { required: string[]; chooseN: number; optional: string[] };
    difficulty_level?: string;
    bloom_level?: string;
    status: string;
    context_links?: { context_id: string; sort_order: number; label?: string }[];
    question_context_links?: { question_context_id: string; sort_order: number; label?: string }[];
    children: QuestionNode[];
    topic_links?: QuestionNodeTopicLink[];
    question_block_links?: QuestionNodeBlockLink[];
    answers?: {
        id: string;
        depth_level: string;
        content: Record<string, unknown> | null;
        content_plain: string | null;
        is_published: boolean;
    }[];
    /** Count of content_block_assets owned by this question (Track 2 polish B.1). */
    diagram_assets_count?: number;
}

/** @deprecated Use McqConfig.options instead */
export interface QuestionOption {
    id?: string;
    label?: string;
    content: string;
    is_correct: boolean;
    sort_order?: number;
}

export interface QuestionListItem {
    id: string;
    content: string;
    question_type: QuestionType;
    year: number | null;
    semester: QuestionSemester | null;
    status: QuestionStatus;
    difficulty_level: QuestionDifficulty | null;
    source: QuestionSource;
    course_code: string | null;
    institution_abbreviation: string | null;
    topic_links_count: number;
    answers_count: number;
    created_at: string;
}

export interface TopicLink {
    id: string;
    title: string;
    is_primary: boolean;
}

export type BlockRelevance = 'primary' | 'secondary' | 'prerequisite';

export interface BlockSearchResult {
    id: string;
    title: string;
    canonical_topic_id: string;
}

export interface QuestionNodeTopicLink {
    id: string;
    canonical_topic_id: string;
    is_primary: boolean;
    canonical_topic: { id: string; title: string };
}

export interface QuestionNodeBlockLink {
    content_block_id: string;
    relevance: BlockRelevance;
    content_block: { id: string; title: string };
}

export interface InstitutionOption {
    id: string;
    name: string;
    abbreviation: string;
}

export interface CourseOption {
    id: string;
    course_code: string;
    course_title: string;
}

export interface TopicSearchResult {
    id: string;
    title: string;
}

export interface ChoiceGroup {
    required: string[];
    chooseN: number;
    optional: string[];
}

export interface SubQuestionFormData {
    id?: string;
    question_type: QuestionType;
    content: string;
    content_doc?: TiptapJSON | null;
    marks: number | null;
    sort_order: number;
    response_config: ResponseConfig;
}

export interface QuestionFormData {
    institution_course_id: string;
    question_paper_id?: string;
    question_section_id?: string;
    parent_question_id?: string;
    exam_subject_id?: string;
    question_type: QuestionType;
    content: string;
    content_doc?: TiptapJSON | null;
    year: number | '';
    semester: QuestionSemester | '';
    marks: number | '';
    difficulty_level: QuestionDifficulty | '';
    bloom_level?: string;
    source: QuestionSource;
    status: QuestionStatus;
    response_config: ResponseConfig;
    topic_ids: string[];
    primary_topic_id: string;
    sub_questions: SubQuestionFormData[];
    choice_group: ChoiceGroup | null;
}

export interface QuestionData extends Omit<QuestionFormData, 'sub_questions' | 'choice_group'> {
    id: string;
    institution_id: string;
    topic_links: TopicLink[];
    sub_questions: SubQuestionFormData[];
    choice_group: ChoiceGroup | null;
}

export interface QuestionEnumOptions {
    question_types: EnumOption<QuestionType>[];
    statuses?: EnumOption<QuestionStatus>[];
    difficulties: EnumOption<QuestionDifficulty>[];
    sources: EnumOption<QuestionSource>[];
    semesters: EnumOption<QuestionSemester>[];
    bloom_levels?: EnumOption[];
    context_types?: EnumOption[];
}

export interface AnswerDepthData {
    depth_level: AnswerDepthLevel;
    label: string;
    description: string;
    answer: {
        id: string;
        content: TiptapJSON;
        content_plain: string | null;
        is_published: boolean;
    } | null;
}

import type { BaseFilters } from '@/hooks/use-filter-handlers';

export interface QuestionFilters extends BaseFilters {
    institution_id?: string;
    institution_course_id?: string;
    year?: string;
    semester?: string;
    question_type?: string;
    status?: string;
    difficulty_level?: string;
    source?: string;
}
