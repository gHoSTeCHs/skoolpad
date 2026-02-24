import type { EducationSystemType, InstitutionType, OwnershipType, ScaleType } from './enums';

export type Country = {
    id: string;
    name: string;
    code: string;
    currency_code: string;
    created_at: string;
    updated_at: string;
};

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
    institution?: { id: string; name: string; abbreviation?: string };
};

export type Department = {
    id: string;
    faculty_id: string;
    name: string;
    abbreviation: string | null;
    created_at: string;
    updated_at: string;
    faculty?: { id: string; name: string; institution_id: string; institution?: { id: string; name: string } };
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
    exam_type?: { id: string; name: string };
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

export type EducationSystem = {
    id: string;
    name: string;
    slug: string;
    country_id: string | null;
    system_type: EducationSystemType;
    created_at: string;
    updated_at: string;
    country?: Country;
    curriculum_tiers_count?: number;
    streams_count?: number;
    curriculum_subjects_count?: number;
    assessment_types_count?: number;
};

export type CurriculumTier = {
    id: string;
    education_system_id: string;
    name: string;
    slug: string;
    sort_order: number;
    is_tertiary: boolean;
    created_at: string;
    updated_at: string;
    education_levels_count?: number;
    education_levels?: EducationLevel[];
};

export type EducationLevel = {
    id: string;
    curriculum_tier_id: string;
    name: string;
    display_name: string | null;
    sort_order: number;
    typical_age_min: number | null;
    typical_age_max: number | null;
    created_at: string;
    updated_at: string;
    level_subjects_count?: number;
    curriculum_tier?: { id: string; name: string };
};

export type Stream = {
    id: string;
    education_system_id: string;
    name: string;
    applies_from_tier_id: string;
    created_at: string;
    updated_at: string;
    applies_from_tier?: { id: string; name: string };
};

export type CurriculumSubject = {
    id: string;
    education_system_id: string;
    name: string;
    slug: string;
    discipline_id: string;
    created_at: string;
    updated_at: string;
    discipline?: { id: string; name: string };
    level_subjects_count?: number;
};

export type GradingScale = {
    id: string;
    name: string;
    scale_type: ScaleType;
    scale_min: number | null;
    scale_max: number | null;
    pass_threshold: number | null;
    grade_boundaries: Record<string, unknown>[] | null;
    classification_labels: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    assessment_types_count?: number;
};

export type AssessmentTypeModel = {
    id: string;
    education_system_id: string;
    name: string;
    slug: string;
    tier_id: string | null;
    is_exit_exam: boolean;
    is_entrance_exam: boolean;
    grading_scale_id: string;
    created_at: string;
    updated_at: string;
    tier?: { id: string; name: string };
    grading_scale?: { id: string; name: string };
};

export type InstitutionTypeModel = {
    id: string;
    country_id: string | null;
    name: string;
    slug: string;
    level_progression: string[] | null;
    credit_system: string | null;
    grading_scale_id: string | null;
    qualification_names: string[] | null;
    created_at: string;
    updated_at: string;
    country?: { id: string; name: string };
    grading_scale?: { id: string; name: string };
};

export type LevelSubject = {
    id: string;
    education_level_id: string;
    curriculum_subject_id: string;
    is_compulsory: boolean;
    stream_id: string | null;
    created_at: string;
    education_level?: { id: string; name: string };
    curriculum_subject?: { id: string; name: string };
    stream?: { id: string; name: string };
};
