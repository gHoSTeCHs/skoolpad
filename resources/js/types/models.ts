import type { InstitutionType, OwnershipType } from './enums';

export type Institution = {
    id: string;
    country_id: string;
    name: string;
    abbreviation: string;
    institution_type: InstitutionType;
    ownership_type: OwnershipType;
    state: string | null;
    city: string | null;
    website: string | null;
    logo_path: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    faculties_count?: number;
};

export type Faculty = {
    id: string;
    institution_id: string;
    name: string;
    abbreviation: string | null;
    created_at: string;
    updated_at: string;
    departments_count?: number;
};

export type Department = {
    id: string;
    faculty_id: string;
    name: string;
    abbreviation: string | null;
    created_at: string;
    updated_at: string;
};

export type Discipline = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    created_at: string;
    updated_at: string;
    canonical_topics_count?: number;
};

export type ExamType = {
    id: string;
    country_id: string;
    name: string;
    slug: string;
    description: string | null;
    duration_minutes: number | null;
    questions_per_subject: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    exam_subjects_count?: number;
};

export type ExamSubject = {
    id: string;
    exam_type_id: string;
    name: string;
    slug: string;
    is_compulsory: boolean;
    created_at: string;
    updated_at: string;
};

export type PaginatedData<T> = {
    data: T[];
    links: Record<string, string | null>;
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};
