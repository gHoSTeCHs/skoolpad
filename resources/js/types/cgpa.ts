export interface GradeBoundary {
    label: string;
    min: number;
    max: number;
    gp: number;
    is_pass: boolean;
}

export interface ClassificationLabel {
    label: string;
    min_cgpa: number;
}

export interface CgpaGradingScale {
    id: string;
    name: string;
    scale_type: string;
    scale_max: number;
    grade_boundaries: GradeBoundary[];
    classification_labels: ClassificationLabel[];
}

export interface ProjectedGradeEntry {
    course_code: string;
    course_title?: string;
    credit_units: number;
    grade: string;
}

export interface SemesterData {
    level: string;
    semester: string;
    courses: ProjectedGradeEntry[];
    gpa?: number;
    total_credits?: number;
}

export interface CgpaSimulation {
    id: string;
    name: string | null;
    mode: 'quick' | 'detailed';
    current_cgpa: number;
    current_credit_hours: number;
    projected_grades: ProjectedGradeEntry[];
    projected_cgpa: number;
    semester_data: SemesterData[] | null;
    target_cgpa: number | null;
    classification: string | null;
    updated_at: string;
}

export interface CalculationResult {
    projected_cgpa: number;
    classification: string | null;
    new_credits: number;
    new_quality_points: number;
}

export interface ReverseCalculatorResult {
    required_gpa: number;
    is_achievable: boolean;
    minimum_grade: string | null;
    message: string;
}

export interface CgpaEnrolledCourse {
    id: string;
    course_code: string;
    course_title: string;
    credit_units: number;
    level: string | null;
    semester: string | null;
}

export interface CgpaSimulatorPageProps {
    simulations: CgpaSimulation[];
    gradingScale: CgpaGradingScale | null;
    enrolledCourses: CgpaEnrolledCourse[];
    isSecondary: boolean;
    levelProgression: string[];
}
