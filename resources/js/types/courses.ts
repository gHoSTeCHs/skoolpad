export type CourseSemester = 'first' | 'second' | 'both';
export type CourseScope = 'department' | 'faculty' | 'institution_wide';
export type CourseLevel = 100 | 200 | 300 | 400 | 500;

export interface InstitutionOption {
    id: string;
    name: string;
    abbreviation: string;
}

export interface FacultyOption {
    id: string;
    name: string;
}

export interface DepartmentOption {
    id: string;
    name: string;
    abbreviation: string | null;
    faculty_id: string;
}

export interface CourseScopeOption {
    value: CourseScope;
    label: string;
}

export interface SemesterOption {
    value: CourseSemester;
    label: string;
}

export interface DisciplineOption {
    id: string;
    name: string;
}

export interface CourseFormData {
    institution_id: string;
    owning_department_id: string;
    discipline_id: string;
    course_code: string;
    course_title: string;
    level: CourseLevel | '';
    semester: CourseSemester | '';
    credit_units: number | '';
    is_elective: boolean;
    course_scope: CourseScope | '';
    description: string;
}

export interface CourseListItem {
    id: string;
    course_code: string;
    course_title: string;
    institution: { id: string; abbreviation: string } | null;
    owning_department: { id: string; name: string } | null;
    level: number;
    semester: CourseSemester;
    credit_units: number | null;
    course_scope: CourseScope;
    topics_count: number;
}

export interface CourseData extends CourseFormData {
    id: string;
}
