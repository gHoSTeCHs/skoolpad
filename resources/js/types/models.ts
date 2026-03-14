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
    institution_type_id: string | null;
    grading_scale_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    faculties_count?: number;
    institution_type_model?: { id: string; name: string };
    education_systems?: { id: string; name: string }[];
    calendar_terms?: CalendarTermModel[];
};

export type CalendarTermModel = {
    id: string;
    institution_id: string;
    academic_year: string;
    name: string;
    start_date: string;
    end_date: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
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

export type CursorPaginatedData<T> = {
    data: T[];
    next_cursor: string | null;
    prev_cursor: string | null;
    per_page: number;
    has_more: boolean;
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
    grade_boundaries: { label: string; min: number; max: number; gp: number; is_pass?: boolean }[] | null;
    classification_labels: { label: string; min_cgpa: number }[] | null;
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
    assessment_subjects?: AssessmentSubjectModel[];
};

export type AssessmentSubjectModel = {
    id: string;
    assessment_type_id: string;
    name: string;
    slug: string;
    is_compulsory: boolean;
    created_at: string;
    updated_at: string;
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

export type ContentBlock = {
    id: string;
    canonical_topic_id: string;
    parent_block_id: string | null;
    title: string;
    slug: string;
    block_type: string;
    path: string;
    depth_level: number;
    sort_order: number;
    content: Record<string, unknown> | null;
    estimated_read_time: number | null;
    difficulty_level: string | null;
    bloom_level: string | null;
    is_container: boolean;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    children?: ContentBlock[];
    children_count?: number;
};

export type CourseBlockMapping = {
    id: string;
    institution_course_id: string | null;
    curriculum_subject_level_id: string | null;
    content_block_id: string;
    teaching_depth: string;
    is_core_block: boolean;
    week_start: number | null;
    week_end: number | null;
    lecture_hours: number | null;
    lab_hours: number | null;
    content_block?: ContentBlock;
};

export type SchemeOfWorkItem = {
    id: string;
    curriculum_subject_level_id: string;
    term: number;
    week_number: number;
    topic_label: string;
    canonical_topic_id: string | null;
    content_block_id: string | null;
    canonical_topic?: { id: string; title: string };
    content_block?: { id: string; title: string; path: string };
};
