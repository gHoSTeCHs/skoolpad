export type OnboardingStep =
    | 'institution'
    | 'faculty'
    | 'department'
    | 'level'
    | 'details'
    | 'courses'
    | 'confirm';

export interface OnboardingFormData {
    institution_id: string;
    faculty_id: string;
    department_id: string;
    level: string;
    matric_number: string;
    admission_year: string;
    course_ids: string[];
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

export interface OnboardingPageProps {
    semester: string;
    academic_year: string;
}
