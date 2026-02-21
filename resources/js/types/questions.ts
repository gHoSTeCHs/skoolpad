import type { TiptapJSON } from '@/types/tiptap';

export type QuestionType = 'mcq' | 'theory' | 'fill_in_blank';
export type QuestionStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionSource = 'manual' | 'crowdsourced' | 'ai_generated' | 'bulk_import';
export type AnswerDepthLevel = 'quick' | 'standard' | 'deep_dive';
export type QuestionSemester = 'first' | 'second';

export interface EnumOption<T extends string = string> {
    value: T;
    label: string;
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

export interface QuestionOption {
    id?: string;
    label?: string;
    content: string;
    is_correct: boolean;
    sort_order?: number;
}

export interface TopicLink {
    id: string;
    title: string;
    is_primary: boolean;
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

export interface QuestionFormData {
    institution_course_id: string;
    question_type: QuestionType;
    content: string;
    year: number | '';
    semester: QuestionSemester | '';
    marks: number | '';
    difficulty_level: QuestionDifficulty | '';
    source: QuestionSource;
    status: QuestionStatus;
    options: QuestionOption[];
    topic_ids: string[];
    primary_topic_id: string;
}

export interface QuestionData extends QuestionFormData {
    id: string;
    institution_id: string;
    topic_links: TopicLink[];
}

export interface QuestionEnumOptions {
    question_types: EnumOption<QuestionType>[];
    statuses?: EnumOption<QuestionStatus>[];
    difficulties: EnumOption<QuestionDifficulty>[];
    sources: EnumOption<QuestionSource>[];
    semesters: EnumOption<QuestionSemester>[];
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
