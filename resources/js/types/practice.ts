import type { QuestionContextData, QuestionType, ResponseConfig } from '@/types/questions';
import type { ReviewMetrics } from '@/types/student-review-queue';

export type PracticeMode = 'timed' | 'untimed' | 'review' | 'speed_drill'
    | 'weak_topic' | 'year_walk' | 'random_mix' | 'full_mock';

export interface EnrolledCourse {
    id: string;
    course_code: string;
    course_title: string;
    topics: { id: string; title: string }[];
}

export interface PracticeConfigPageProps {
    enrolledCourses: EnrolledCourse[];
    modes: { value: PracticeMode; label: string }[];
    difficulties: { value: string; label: string }[];
    questionTypes: { value: string; label: string }[];
}

export interface PracticeSessionData {
    id: string;
    mode: PracticeMode;
    question_count: number;
    time_limit_seconds: number | null;
    is_resumable: boolean;
    completed_at: string | null;
}

export interface PracticeQuestionData {
    id: string;
    content: string;
    question_type: QuestionType;
    response_config: ResponseConfig;
    marks: number | null;
    difficulty_level: string | null;
    sequence_order: number;
    contexts: QuestionContextData[];
    children: {
        id: string;
        content: string;
        question_type: QuestionType;
        response_config: ResponseConfig;
        marks: number | null;
    }[];
    quick_answer: { content: Record<string, unknown> | null; content_plain: string | null } | null;
    topic_links: { canonical_topic: { id: string; title: string } }[];
}

export interface PracticeAnswerData {
    id: string;
    question_id: string;
    selected_option_label: string | null;
    response_data: Record<string, unknown> | null;
    is_correct: boolean | null;
    time_spent_seconds: number | null;
    was_skipped: boolean;
    sequence_order: number;
}

export interface PracticeShowPageProps {
    session: PracticeSessionData;
    questions: PracticeQuestionData[];
    answers: Record<string, PracticeAnswerData>;
    currentIndex: number;
}

export interface AnswerSubmissionPayload {
    question_id: string;
    selected_label?: string | null;
    text?: string | null;
    response_data?: Record<string, unknown>;
    time_spent_seconds: number;
    sequence_order: number;
    was_skipped?: boolean;
}

export interface AnswerSubmissionResponse {
    is_correct: boolean | null;
    correct_answer: Record<string, unknown> | null;
    quick_answer_content: Record<string, unknown> | null;
}

export interface PracticeResultsPageProps {
    session: {
        id: string;
        mode: PracticeMode;
        question_count: number;
        correct_count: number;
        total_time_seconds: number | null;
        time_limit_seconds: number | null;
        score_percentage: number | null;
        completed_at: string;
        institution_course: {
            id: string;
            course_code: string;
            course_title: string;
        } | null;
    };
    perQuestion: {
        question_id: string;
        question_content: string;
        question_type: QuestionType;
        is_correct: boolean | null;
        was_skipped: boolean;
        student_answer: Record<string, unknown> | null;
        correct_answer: Record<string, unknown> | null;
        time_spent_seconds: number | null;
        quick_answer: Record<string, unknown> | null;
    }[];
    perTopic: {
        topic_id: string;
        topic_title: string;
        correct: number;
        total: number;
        accuracy: number;
    }[];
    reviewMetrics?: ReviewMetrics;
}
