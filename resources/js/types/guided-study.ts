export type StudyPlanItemType = 'review' | 'study' | 'practice';

export interface StudyPlanItem {
    type: StudyPlanItemType;
    priority_tier: 0 | 1 | 2 | 3 | 4;
    subject_name: string;
    level_subject_id: string;
    topic_label: string;
    canonical_topic_id: string | null;
    content_block_id: string | null;
    estimated_minutes: number;
    is_completed: boolean;
}

export interface GuidedStudyPlan {
    daily_goal_minutes: number;
    total_estimated_minutes: number;
    completed_minutes: number;
    current_term: number;
    current_week: number;
    items: StudyPlanItem[];
}
