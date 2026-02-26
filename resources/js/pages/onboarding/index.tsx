import { Head, useForm } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import OnboardingController from '@/actions/App/Http/Controllers/Student/OnboardingController';
import OnboardingLayout from '@/layouts/onboarding-layout';
import type {
    DepartmentResult,
    FacultyResult,
    InstitutionSearchResult,
    OnboardingFormData,
    OnboardingPageProps,
    OnboardingStep,
    SuggestedCourse,
} from '@/types/onboarding';
import ConfirmStep from './steps/confirm-step';
import CoursesStep from './steps/courses-step';
import DepartmentStep from './steps/department-step';
import DetailsStep from './steps/details-step';
import FacultyStep from './steps/faculty-step';
import InstitutionStep from './steps/institution-step';
import LevelStep from './steps/level-step';

const STEPS: OnboardingStep[] = ['institution', 'faculty', 'department', 'level', 'details', 'courses', 'confirm'];

export default function Onboarding({ semester, academic_year }: OnboardingPageProps) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('institution');
    const stepIndex = STEPS.indexOf(currentStep);

    const [selectedInstitution, setSelectedInstitution] = useState<InstitutionSearchResult | null>(null);
    const [faculties, setFaculties] = useState<FacultyResult[]>([]);
    const [departments, setDepartments] = useState<DepartmentResult[]>([]);
    const [loadingFaculties, setLoadingFaculties] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [allCourses, setAllCourses] = useState<SuggestedCourse[]>([]);

    const form = useForm<OnboardingFormData>({
        institution_id: '',
        faculty_id: '',
        department_id: '',
        level: '',
        matric_number: '',
        admission_year: '',
        course_ids: [],
    });

    function goNext() {
        const idx = STEPS.indexOf(currentStep);
        if (idx < STEPS.length - 1) {
            setCurrentStep(STEPS[idx + 1]);
        }
    }

    function goBack() {
        const idx = STEPS.indexOf(currentStep);
        if (idx > 0) {
            setCurrentStep(STEPS[idx - 1]);
        }
    }

    const fetchFaculties = useCallback(async (institutionId: string) => {
        setLoadingFaculties(true);
        try {
            const response = await fetch(OnboardingController.faculties.url(institutionId));
            const data = await response.json();
            setFaculties(data);
        } finally {
            setLoadingFaculties(false);
        }
    }, []);

    const fetchDepartments = useCallback(async (facultyId: string) => {
        setLoadingDepartments(true);
        try {
            const response = await fetch(OnboardingController.departments.url(facultyId));
            const data = await response.json();
            setDepartments(data);
        } finally {
            setLoadingDepartments(false);
        }
    }, []);

    function handleInstitutionSelect(institution: InstitutionSearchResult) {
        setSelectedInstitution(institution);
        form.setData((prev) => ({
            ...prev,
            institution_id: institution.id,
            faculty_id: '',
            department_id: '',
            course_ids: [],
        }));
        setFaculties([]);
        setDepartments([]);
        setAllCourses([]);
        fetchFaculties(institution.id);
    }

    function handleFacultySelect(facultyId: string) {
        form.setData((prev) => ({ ...prev, faculty_id: facultyId, department_id: '' }));
        setDepartments([]);
        fetchDepartments(facultyId);
    }

    function handleDepartmentSelect(departmentId: string) {
        form.setData('department_id', departmentId);
    }

    function handleLevelSelect(level: string) {
        form.setData((prev) => ({ ...prev, level, course_ids: [] }));
        setAllCourses([]);
    }

    function handleCourseToggle(courseId: string) {
        form.setData((prev) => {
            const ids = prev.course_ids.includes(courseId)
                ? prev.course_ids.filter((id) => id !== courseId)
                : [...prev.course_ids, courseId];
            return { ...prev, course_ids: ids };
        });
    }

    function handleSubmit() {
        form.post(OnboardingController.store.url());
    }

    const selectedFaculty = faculties.find((f) => f.id === form.data.faculty_id);
    const selectedDepartment = departments.find((d) => d.id === form.data.department_id);

    const selectedCourses = allCourses.filter((c) => form.data.course_ids.includes(c.id));

    return (
        <OnboardingLayout currentStep={stepIndex + 1} totalSteps={STEPS.length}>
            <Head title="Onboarding" />

            {currentStep === 'institution' && (
                <InstitutionStep
                    value={form.data.institution_id}
                    selectedInstitution={selectedInstitution}
                    onSelect={handleInstitutionSelect}
                    onNext={goNext}
                />
            )}

            {currentStep === 'faculty' && (
                <FacultyStep
                    value={form.data.faculty_id}
                    faculties={faculties}
                    loading={loadingFaculties}
                    onSelect={handleFacultySelect}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'department' && (
                <DepartmentStep
                    value={form.data.department_id}
                    departments={departments}
                    loading={loadingDepartments}
                    onSelect={handleDepartmentSelect}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'level' && (
                <LevelStep
                    value={form.data.level}
                    onSelect={handleLevelSelect}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'details' && (
                <DetailsStep
                    matricNumber={form.data.matric_number}
                    admissionYear={form.data.admission_year}
                    onMatricChange={(v) => form.setData('matric_number', v)}
                    onYearChange={(v) => form.setData('admission_year', v)}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'courses' && (
                <CoursesStep
                    selectedIds={form.data.course_ids}
                    institutionId={form.data.institution_id}
                    departmentId={form.data.department_id}
                    level={form.data.level}
                    onToggle={handleCourseToggle}
                    onCoursesLoaded={setAllCourses}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'confirm' && (
                <ConfirmStep
                    institution={selectedInstitution}
                    facultyName={selectedFaculty?.name ?? ''}
                    departmentName={selectedDepartment?.name ?? ''}
                    level={form.data.level}
                    matricNumber={form.data.matric_number}
                    admissionYear={form.data.admission_year}
                    selectedCourses={selectedCourses}
                    isSubmitting={form.processing}
                    onSubmit={handleSubmit}
                    onBack={goBack}
                />
            )}
        </OnboardingLayout>
    );
}
