import type { QuestionStatus, QuestionType, QuestionDifficulty } from './questions';

export interface LibraryCounts {
    total_questions: number;
    papers: number;
    course_pools: number;
    exam_subject_pools: number;
    unattached: number;
}

export interface LibraryPaper {
    id: string;
    title: string;
    course_code: string | null;
    institution_abbreviation: string | null;
    assessment_type_name: string | null;
    year: number | null;
    total_marks: number | null;
    is_published: boolean;
    questions_count: number;
    sections_count: number;
    contexts_count: number;
    answers_filled: number;
    answers_published: number;
    answers_total_slots: number;
    complete_percent: number;
    updated_at: string | null;
}

export interface CoursePool {
    id: string;
    course_code: string;
    course_title: string;
    institution_abbreviation: string | null;
    institution_name: string | null;
    pool_questions_count: number;
    updated_at: string | null;
}

export interface ExamSubjectPool {
    id: string;
    name: string;
    pool_questions_count: number;
}

export interface UnattachedQuestion {
    id: string;
    question_type: QuestionType;
    status: QuestionStatus | string;
    difficulty_level: QuestionDifficulty | string | null;
    stem_preview: string;
    updated_at: string | null;
}

export interface LibrarySearchResults {
    papers: Array<{ id: string; title: string; year: number | null; course_code: string | null }>;
    course_pools: Array<{ id: string; course_code: string; course_title: string }>;
    exam_pools: Array<{ id: string; name: string }>;
    questions: Array<{
        id: string;
        question_type: QuestionType;
        stem_preview: string;
        question_paper_id: string | null;
        institution_course_id: string | null;
    }>;
}

export type LibraryStatusFilter = 'all' | 'published' | 'draft';

export type LibraryTab = 'papers' | 'course_pools' | 'exam_pools' | 'unattached';
