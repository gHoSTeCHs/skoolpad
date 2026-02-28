import type { StudentType } from './enums';

export type OnboardingStep =
    | 'student_type'
    | 'institution'
    | 'faculty'
    | 'department'
    | 'level'
    | 'details'
    | 'courses'
    | 'country'
    | 'education_system'
    | 'secondary_level'
    | 'stream_subjects'
    | 'exam_goals'
    | 'confirm';

export interface OnboardingFormData {
    student_type: StudentType | '';
    institution_id: string;
    faculty_id: string;
    department_id: string;
    level: string;
    matric_number: string;
    admission_year: string;
    course_ids: string[];
    education_system_id: string;
    education_level_id: string;
    stream_id: string;
    school_name: string;
    state_or_region: string;
    exam_goals: string[];
}

export interface InstitutionSearchResult {
    id: string;
    name: string;
    abbreviation: string;
}

export interface FacultyResult {
    id: string;
    institution_id: string;
    name: string;
    abbreviation: string;
}

export interface DepartmentResult {
    id: string;
    faculty_id: string;
    name: string;
    abbreviation: string;
}

export interface SuggestedCourse {
    id: string;
    course_code: string;
    course_title: string;
    credit_units: number;
    semester: string;
    is_elective: boolean;
}

export interface CountryResult {
    id: string;
    name: string;
    code: string;
}

export interface EducationSystemResult {
    id: string;
    name: string;
    slug: string;
    system_type: string;
}

export interface EducationLevelResult {
    id: string;
    name: string;
    display_name: string;
    sort_order: number;
    typical_age_min: number | null;
    typical_age_max: number | null;
}

export interface CurriculumTierResult {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    education_levels: EducationLevelResult[];
}

export interface StreamResult {
    id: string;
    name: string;
    applies_from_tier_id: string | null;
}

export interface LevelSubjectResult {
    id: string;
    education_level_id: string;
    curriculum_subject_id: string;
    is_compulsory: boolean;
    stream_id: string | null;
    curriculum_subject: {
        id: string;
        name: string;
    };
}

export interface AssessmentTypeResult {
    id: string;
    name: string;
    slug: string;
    is_exit_exam: boolean;
    is_entrance_exam: boolean;
}

export interface OnboardingPageProps {
    semester: string;
    academic_year: string;
    countries: CountryResult[];
}
