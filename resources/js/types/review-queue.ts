import type { BaseFilters } from '@/hooks/use-filter-handlers';

export interface SubmissionListItem {
    id: string;
    submission_type: string;
    submission_type_label: string;
    status: string;
    status_label: string;
    submitted_by_name: string;
    course_code: string | null;
    institution_abbreviation: string | null;
    has_images: boolean;
    created_at: string;
}

export interface UploadListItem extends SubmissionListItem {
    images: string[] | null;
    content: Record<string, unknown> | null;
    exam_year: number | null;
}

export interface SubmissionDetail {
    id: string;
    submission_type: string;
    submission_type_label: string;
    status: string;
    status_label: string;
    content: Record<string, unknown> | unknown[] | null;
    images: string[] | null;
    exam_year: number | null;
    exam_semester: string | null;
    reviewer_notes: string | null;
    reviewed_at: string | null;
    created_at: string;
    submitted_by: { id: string; name: string; email: string } | null;
    reviewer: { id: string; name: string } | null;
    institution_course: {
        id: string;
        course_code: string;
        institution: { id: string; abbreviation: string };
    } | null;
    related_question: { id: string; content: string } | null;
    related_topic: { id: string; title: string } | null;
}

export interface ReviewQueueFilters extends BaseFilters {
    submission_type?: string;
    status?: string;
}

export interface TranscribeQuestionForm {
    institution_course_id: string;
    question_type: string;
    content: string;
    year: number | '';
    semester: string;
    difficulty_level: string;
    topic_id: string;
    options: { content: string; is_correct: boolean }[];
}
