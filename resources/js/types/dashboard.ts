export interface RegistrationTrend {
    date: string;
    count: number;
}

export interface InstitutionCount {
    name: string;
    abbreviation: string;
    count: number;
}

export interface UserMetrics {
    total_users: number;
    total_students: number;
    total_staff: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    registrations_trend: RegistrationTrend[];
    users_by_institution: InstitutionCount[];
}

export interface ContentMetrics {
    total_questions: number;
    published_questions: number;
    draft_questions: number;
    in_review_questions: number;
    total_topics: number;
    published_topics: number;
    total_courses: number;
    courses_with_questions: number;
    questions_by_institution: InstitutionCount[];
}

export interface ActiveUserMetrics {
    dau: number;
    wau: number;
    mau: number;
}

export interface PracticeMetrics {
    total_sessions: number;
    avg_score: number | null;
    most_practiced_courses: string[];
}
