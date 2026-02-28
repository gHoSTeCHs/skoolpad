import type { CursorPaginatedData, PaginatedData } from '@/types/models';
import type { AnswerDepthLevel, QuestionDifficulty, QuestionSemester, QuestionType } from '@/types/questions';

export interface QuestionContextData {
    id: string;
    context_type: string;
    title: string | null;
    content: string | null;
    media_url: string | null;
    table_data: { headers: string[]; rows: string[][] } | null;
    word_bank: string[] | null;
    pivot: {
        sort_order: number;
        label: string | null;
    };
}

export interface BrowseQuestion {
    id: string;
    content: string;
    question_type: QuestionType;
    year: number | null;
    semester: QuestionSemester | null;
    difficulty_level: QuestionDifficulty | null;
    marks: number | null;
    institution_course: {
        id: string;
        course_code: string;
        course_title: string;
        institution: {
            id: string;
            name: string;
            abbreviation: string;
        };
    } | null;
    topic_links: {
        id: string;
        canonical_topic_id: string;
        is_primary: boolean;
        canonical_topic: {
            id: string;
            title: string;
        };
    }[];
    answers: {
        id: string;
        depth_level: AnswerDepthLevel;
        content: Record<string, unknown> | null;
        content_plain: string | null;
        is_published: boolean;
    }[];
    contexts: QuestionContextData[];
}

export interface BrowseFilterOptions {
    institutions: { id: string; name: string; abbreviation: string }[];
    courses: { id: string; course_code: string; course_title: string }[];
    years: number[];
    topics: { id: string; title: string }[];
}

export interface BrowseAppliedFilters {
    institution_id?: string;
    course_id?: string;
    year?: string;
    semester?: string;
    topic_id?: string;
    difficulty?: string;
    type?: string;
    search?: string;
    browse_all?: string;
}

export interface QuestionBrowserProps {
    questions: CursorPaginatedData<BrowseQuestion>;
    filterOptions: BrowseFilterOptions;
    appliedFilters: BrowseAppliedFilters;
    totalCount: number;
}

export interface BrowsePaper {
    id: string;
    title: string;
    academic_session: string | null;
    semester: string | null;
    year: number | null;
    total_marks: number;
    duration_minutes: number;
    sections_count: number;
    questions_count: number;
    institution_course: {
        id: string;
        course_code: string;
        course_title: string;
        institution: { id: string; name: string; abbreviation: string };
    } | null;
    assessment_type: { id: string; name: string } | null;
}

export interface PaperFilterOptions {
    courses: { id: string; course_code: string; course_title: string }[];
    years: number[];
}

export interface PaperAppliedFilters {
    course_id?: string;
    year?: string;
    semester?: string;
}

export interface PapersTabProps {
    papers: PaginatedData<BrowsePaper>;
    paperFilterOptions: PaperFilterOptions;
    paperFilters: PaperAppliedFilters;
    paperCount: number;
}

export type QuestionsPageProps =
    | ({ tab: 'papers' } & PapersTabProps)
    | ({ tab: 'search' } & QuestionBrowserProps);
