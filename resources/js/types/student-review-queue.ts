export type ReviewStrength = 'weak' | 'growing' | 'strong';

export interface ReviewQueueItem {
    id: string;
    question_id: string;
    strength: ReviewStrength;
    interval_days: number;
    next_review_at: string;
    question_content: string | null;
    course_code: string | null;
}

export interface ReviewQueuePageProps {
    dueCount: number;
    dueItems: ReviewQueueItem[];
    enrolledCourses: { id: string; course_code: string; course_title: string }[];
    enrolledSubjects: { id: string; subject_name: string }[];
    isSecondary: boolean;
    selectedCourseId: string | null;
    selectedSubjectId: string | null;
    calendar: Record<number, number>;
}

export interface ReviewMetrics {
    progressed: number;
    reset: number;
    graduated: number;
}
