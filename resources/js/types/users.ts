import type { BaseFilters } from '@/hooks/use-filter-handlers';

export type UserListItem = {
    id: string;
    name: string;
    email: string;
    role: string;
    role_label: string;
    is_active: boolean;
    institution_abbreviation: string | null;
    last_login_at: string | null;
    created_at: string;
};

export type UserDetail = {
    id: string;
    name: string;
    email: string;
    role: string;
    role_label: string;
    role_description: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    practice_sessions_count: number;
    student_notes_count: number;
    content_submissions_count: number;
    student_profile: {
        id: string;
        level: number | null;
        matric_number: string | null;
        institution: { id: string; name: string; abbreviation: string } | null;
        faculty: { id: string; name: string } | null;
        department: { id: string; name: string } | null;
        student_courses: { id: string }[];
    } | null;
};

export interface UserFilters extends BaseFilters {
    role?: string;
    is_active?: string;
}
