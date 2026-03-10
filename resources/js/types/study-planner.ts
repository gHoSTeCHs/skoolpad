export type TopicReadinessStatus = 'not_started' | 'read_only' | 'weak' | 'developing' | 'strong';

export interface DailyStudyPlan {
    total_minutes: number;
    baseline_minutes: number;
    reason: string;
    items: DailyPlanItem[];
    exam_breakdown: ExamBreakdown[];
}

export interface DailyPlanItem {
    type: 'review' | 'exam_prep';
    priority: number;
    entry_id: string | null;
    subject_name: string | null;
    topic_id: string | null;
    topic_title: string;
    action: 'read' | 'practice' | 'review';
    content_block_id: string | null;
    suggested_question_count: number | null;
    estimated_minutes: number;
}

export interface ExamBreakdown {
    entry_id: string;
    subject_name: string;
    days_remaining: number;
    allocated_minutes: number;
    weak_topic_count: number;
    ready_topic_count: number;
}

export interface TopicReadiness {
    topic_id: string;
    topic_title: string;
    status: TopicReadinessStatus;
    accuracy: number;
    attempts: number;
    is_read: boolean;
    is_aoc: boolean;
}

export interface ExamSummary {
    next_exam: { label: string; days_remaining: number; exam_date: string } | null;
    total_active: number;
    total_weak_topics: number;
    recommended_minutes: number;
    focus_topics: string[];
}
