export type ParentalRelationship = 'mother' | 'father' | 'guardian';
export type ParentChildLinkStatus = 'pending' | 'active' | 'revoked';
export type VerificationResult = 'understood' | 'partially_understood' | 'needs_review';
export type TopicCoverageStatusValue = 'not_yet_covered' | 'covered' | 'skipped';
export type TopicCoverageSource = 'scheme_default' | 'parent_reported' | 'app_activity';
export type Term = 'first' | 'second' | 'third';
export type CheckInSessionStatus = 'pending' | 'in_progress' | 'completed';
export type ExamAlertUrgency = 'informational' | 'warning' | 'critical' | 'exam_day';
export type ParentInviteTrigger = 'first_practice_above_60' | 'high_score' | 'three_day_streak' | 'consistent_first_week';

export type ParentProfile = {
    id: string;
    user_id: string;
    phone_number: string | null;
    relationship: ParentalRelationship;
    notification_preferences: NotificationPreferences;
    created_at: string;
    updated_at: string;
};

export type NotificationPreferences = {
    alert_channels?: string[];
    exam_alert_channels?: string[];
};

export type ParentChildLink = {
    id: string;
    parent_profile_id: string | null;
    student_profile_id: string;
    status: ParentChildLinkStatus;
    linked_at: string | null;
    data_consent_granted_at: string | null;
    study_goal_minutes: number | null;
    current_term: Term | null;
    term_start_date: string | null;
    grace_period_ends_at: string | null;
    created_at: string;
};

export type LinkedChild = {
    id: string;
    parent_profile_id: string;
    student_profile_id: string;
    status: ParentChildLinkStatus;
    study_goal_minutes: number | null;
    student_profile?: {
        id: string;
        user: {
            id: string;
            name: string;
        };
    };
};

export type McqItem = {
    id: string;
    question_text: string;
    options: { key: string; text: string }[];
    correct_key: string;
};

export type VerificationKit = {
    topic_id: string;
    topic_title: string;
    parent_briefing: string | null;
    key_concepts: string[];
    true_false: VerificationTrueFalseItem[];
    explain_prompt: string | null;
    mcq_questions?: McqItem[];
};

export type VerificationTrueFalseItem = {
    statement: string;
    answer: boolean;
    explanation: string;
};

export type VerificationResponses = {
    explain_checklist?: {
        concepts_checked?: number[];
        concepts_total?: number;
    };
    true_false?: {
        child_answer: boolean;
        correct?: boolean;
    }[];
    mcq_answers?: {
        question_id: string;
        selected_label: string | null;
    }[];
};

export type VerificationAttempt = {
    id: string;
    parent_child_link_id: string;
    canonical_topic_id: string;
    responses: VerificationResponses;
    overall_result: VerificationResult;
    notes: string | null;
    created_at: string;
};

export type VerificationQueueItem = {
    id: string;
    title: string;
    education_level: string;
};

export type VerificationStats = {
    total: number;
    understood: number;
    partially_understood: number;
    needs_review: number;
};

export type CheckInSession = {
    id: string;
    session_date: string;
    duration_minutes: number;
    items: CheckInItem[];
    completed_items: CheckInCompletedItem[];
    status: CheckInSessionStatus;
    started_at: string | null;
    completed_at: string | null;
};

export type CheckInItem = {
    type: 'scheme_alignment' | 'verification' | 'weak_area_review' | 'topic_preview';
    canonical_topic_id: string;
    topic_title: string;
    estimated_minutes: number;
    week_number?: number;
    parent_briefing?: string | null;
};

export type CheckInCompletedItem = {
    canonical_topic_id: string;
    type: string;
    completed: boolean;
};

export type TopicCoverage = {
    id: string;
    parent_child_link_id: string;
    canonical_topic_id: string;
    status: TopicCoverageStatusValue;
    covered_at: string | null;
    source: TopicCoverageSource;
};

export type ExamReadiness = {
    subject_name: string | null;
    composite_score: number;
    syllabus_coverage?: number;
    practice_performance?: number;
    spaced_retention?: number;
    parent_verification?: number;
};

export type ExamCountdown = {
    id: string;
    user_id: string;
    exam_name: string;
    exam_date: string;
    alert_start_days_before: number;
    is_active: boolean;
};

export type ReadTogetherData = {
    topic_id: string;
    topic_title: string;
    content: Record<string, unknown> | null;
    verification_kit: Record<string, unknown> | null;
};

export type StudyAsChildContext = {
    child_user_id: string;
    child_name: string;
    student_profile_id: string;
    is_secondary: boolean;
    subjects: { id: string; subject_name: string | null }[];
    study_goal_minutes: number;
};

export type ChildSettingConfig = {
    link_id: string;
    child_name: string | null;
    study_goal_minutes: number | null;
    current_term: Term | null;
    term_start_date: string | null;
};

export type ParentSettingsData = {
    notification_preferences: NotificationPreferences;
    children_settings: ChildSettingConfig[];
};

export type SubjectStrength = {
    level_subject_id: string;
    subject_name: string;
    status: 'strong' | 'moderate' | 'weak' | 'not_started';
    performance_percentage: number;
};

export type WeeklySummary = {
    total_app_minutes: number;
    total_check_ins: number;
    topics_verified: number;
    study_minutes_by_day: { date: string; minutes: number }[];
};

export type StreakData = {
    current_streak: number;
    longest_streak: number;
    calendar: { date: string; had_activity: boolean }[];
};

export type ChildDailyActivity = {
    studied_today: boolean;
    study_minutes_today: number;
    subjects_today: { name: string; minutes: number }[];
    guided_study_progress: { completed: number; total: number } | null;
};

export type ParentDashboardData = {
    children: LinkedChild[];
    subscription_status: string;
    check_in: CheckInSession | null;
    readiness_scores: ExamReadiness[];
    subject_strengths: SubjectStrength[];
    weekly_summary: WeeklySummary | null;
    streak: StreakData | null;
    daily_activity: ChildDailyActivity | null;
};

export type ChildSummary = {
    id: string;
    name: string;
};

export type WeeklyReportData = {
    child_name: string;
    study_time_minutes: number;
    subjects_practiced: string[];
    questions_answered: number;
    accuracy: number;
    verifications: VerificationStats;
    readiness_scores: ExamReadiness[];
};

export type ExamAlertData = {
    child_name: string;
    exam_name: string;
    exam_date: string;
    days_remaining: number;
    urgency: ExamAlertUrgency;
    readiness_score: number | null;
    study_time_today_minutes: number;
    questions_today: number;
    accuracy_today: number;
    unverified_topic_count: number;
};
