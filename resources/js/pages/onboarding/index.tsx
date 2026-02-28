import { Head, useForm } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import OnboardingController from '@/actions/App/Http/Controllers/Student/OnboardingController';
import OnboardingLayout from '@/layouts/onboarding-layout';
import type { StudentType } from '@/types/enums';
import type {
    AssessmentTypeResult,
    CurriculumTierResult,
    DepartmentResult,
    EducationSystemResult,
    FacultyResult,
    InstitutionSearchResult,
    LevelSubjectResult,
    OnboardingFormData,
    OnboardingPageProps,
    OnboardingStep,
    StreamResult,
    SuggestedCourse,
} from '@/types/onboarding';
import ConfirmStep from './steps/confirm-step';
import CountryStep from './steps/country-step';
import CoursesStep from './steps/courses-step';
import DepartmentStep from './steps/department-step';
import DetailsStep from './steps/details-step';
import EducationSystemStep from './steps/education-system-step';
import ExamGoalsStep from './steps/exam-goals-step';
import FacultyStep from './steps/faculty-step';
import InstitutionStep from './steps/institution-step';
import LevelStep from './steps/level-step';
import SecondaryLevelStep from './steps/secondary-level-step';
import StreamSubjectsStep from './steps/stream-subjects-step';
import StudentTypeStep from './steps/student-type-step';

const jsonHeaders = { headers: { Accept: 'application/json' } };

const TERTIARY_STEPS: OnboardingStep[] = ['student_type', 'institution', 'faculty', 'department', 'level', 'details', 'courses', 'confirm'];
const SECONDARY_STEPS: OnboardingStep[] = ['student_type', 'country', 'education_system', 'secondary_level', 'stream_subjects', 'exam_goals', 'confirm'];

function getSteps(studentType: StudentType | ''): OnboardingStep[] {
    if (studentType === 'tertiary') return TERTIARY_STEPS;
    if (studentType === 'secondary') return SECONDARY_STEPS;
    return ['student_type'];
}

export default function Onboarding({ countries }: OnboardingPageProps) {
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('student_type');

    const [selectedInstitution, setSelectedInstitution] = useState<InstitutionSearchResult | null>(null);
    const [faculties, setFaculties] = useState<FacultyResult[]>([]);
    const [departments, setDepartments] = useState<DepartmentResult[]>([]);
    const [loadingFaculties, setLoadingFaculties] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [allCourses, setAllCourses] = useState<SuggestedCourse[]>([]);

    const [educationSystems, setEducationSystems] = useState<EducationSystemResult[]>([]);
    const [loadingEducationSystems, setLoadingEducationSystems] = useState(false);
    const [tiers, setTiers] = useState<CurriculumTierResult[]>([]);
    const [loadingTiers, setLoadingTiers] = useState(false);
    const [streams, setStreams] = useState<StreamResult[]>([]);
    const [levelSubjects, setLevelSubjects] = useState<LevelSubjectResult[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [assessmentTypes, setAssessmentTypes] = useState<AssessmentTypeResult[]>([]);
    const [loadingAssessmentTypes, setLoadingAssessmentTypes] = useState(false);
    const [levelProgression, setLevelProgression] = useState<string[]>([]);
    const [loadingLevelProgression, setLoadingLevelProgression] = useState(false);
    const [selectedCountryId, setSelectedCountryId] = useState('');

    const form = useForm<OnboardingFormData>({
        student_type: '',
        institution_id: '',
        faculty_id: '',
        department_id: '',
        level: '',
        matric_number: '',
        admission_year: '',
        course_ids: [],
        education_system_id: '',
        education_level_id: '',
        stream_id: '',
        school_name: '',
        state_or_region: '',
        exam_goals: [],
    });

    const steps = getSteps(form.data.student_type);
    const stepIndex = steps.indexOf(currentStep);

    function goNext() {
        const idx = steps.indexOf(currentStep);
        if (idx < steps.length - 1) {
            setCurrentStep(steps[idx + 1]);
        }
    }

    function goBack() {
        const idx = steps.indexOf(currentStep);
        if (idx > 0) {
            setCurrentStep(steps[idx - 1]);
        }
    }

    const fetchFaculties = useCallback(async (institutionId: string) => {
        setLoadingFaculties(true);
        try {
            const response = await fetch(OnboardingController.faculties.url(institutionId), jsonHeaders);
            const data = await response.json();
            setFaculties(data);
        } finally {
            setLoadingFaculties(false);
        }
    }, []);

    const fetchDepartments = useCallback(async (facultyId: string) => {
        setLoadingDepartments(true);
        try {
            const response = await fetch(OnboardingController.departments.url(facultyId), jsonHeaders);
            const data = await response.json();
            setDepartments(data);
        } finally {
            setLoadingDepartments(false);
        }
    }, []);

    const fetchLevelProgression = useCallback(async (institutionId: string) => {
        setLoadingLevelProgression(true);
        try {
            const response = await fetch(OnboardingController.institutionTypeLevels.url(institutionId), jsonHeaders);
            const data = await response.json();
            setLevelProgression(data.level_progression ?? []);
        } finally {
            setLoadingLevelProgression(false);
        }
    }, []);

    const fetchEducationSystems = useCallback(async (countryId: string) => {
        setLoadingEducationSystems(true);
        try {
            const response = await fetch(OnboardingController.educationSystems.url(countryId), jsonHeaders);
            const data = await response.json();
            setEducationSystems(data);
        } finally {
            setLoadingEducationSystems(false);
        }
    }, []);

    const fetchTiers = useCallback(async (systemId: string) => {
        setLoadingTiers(true);
        try {
            const response = await fetch(OnboardingController.curriculumTiers.url(systemId), jsonHeaders);
            const data = await response.json();
            setTiers(data);
        } finally {
            setLoadingTiers(false);
        }
    }, []);

    const fetchStreams = useCallback(async (systemId: string) => {
        const response = await fetch(OnboardingController.streams.url(systemId), jsonHeaders);
        const data = await response.json();
        setStreams(data);
    }, []);

    const fetchLevelSubjectsData = useCallback(async (levelId: string, streamId?: string) => {
        setLoadingSubjects(true);
        try {
            const queryOptions = streamId ? { query: { stream_id: streamId } } : undefined;
            const response = await fetch(OnboardingController.levelSubjects.url(levelId, queryOptions), jsonHeaders);
            const data = await response.json();
            setLevelSubjects(data);
        } finally {
            setLoadingSubjects(false);
        }
    }, []);

    const fetchAssessmentTypesData = useCallback(async (systemId: string) => {
        setLoadingAssessmentTypes(true);
        try {
            const response = await fetch(OnboardingController.assessmentTypes.url(systemId), jsonHeaders);
            const data = await response.json();
            setAssessmentTypes(data);
        } finally {
            setLoadingAssessmentTypes(false);
        }
    }, []);

    function handleStudentTypeSelect(type: StudentType) {
        form.setData((prev) => ({
            ...prev,
            student_type: type,
            institution_id: '',
            faculty_id: '',
            department_id: '',
            level: '',
            matric_number: '',
            admission_year: '',
            course_ids: [],
            education_system_id: '',
            education_level_id: '',
            stream_id: '',
            school_name: '',
            state_or_region: '',
            exam_goals: [],
        }));
        setSelectedInstitution(null);
        setFaculties([]);
        setDepartments([]);
        setAllCourses([]);
        setEducationSystems([]);
        setTiers([]);
        setStreams([]);
        setLevelSubjects([]);
        setAssessmentTypes([]);
        setLevelProgression([]);
        setSelectedCountryId('');
    }

    function handleInstitutionSelect(institution: InstitutionSearchResult) {
        setSelectedInstitution(institution);
        form.setData((prev) => ({
            ...prev,
            institution_id: institution.id,
            faculty_id: '',
            department_id: '',
            level: '',
            course_ids: [],
        }));
        setFaculties([]);
        setDepartments([]);
        setAllCourses([]);
        setLevelProgression([]);
        fetchFaculties(institution.id);
        fetchLevelProgression(institution.id);
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

    function handleCountrySelect(countryId: string) {
        setSelectedCountryId(countryId);
        form.setData((prev) => ({
            ...prev,
            education_system_id: '',
            education_level_id: '',
            stream_id: '',
            exam_goals: [],
        }));
        setEducationSystems([]);
        setTiers([]);
        setStreams([]);
        setLevelSubjects([]);
        setAssessmentTypes([]);
        fetchEducationSystems(countryId);
    }

    function handleEducationSystemSelect(systemId: string) {
        form.setData((prev) => ({
            ...prev,
            education_system_id: systemId,
            education_level_id: '',
            stream_id: '',
            exam_goals: [],
        }));
        setTiers([]);
        setStreams([]);
        setLevelSubjects([]);
        setAssessmentTypes([]);
        fetchTiers(systemId);
        fetchStreams(systemId);
        fetchAssessmentTypesData(systemId);
    }

    function handleSecondaryLevelSelect(levelId: string) {
        form.setData((prev) => ({ ...prev, education_level_id: levelId, stream_id: '' }));
        setLevelSubjects([]);
        fetchLevelSubjectsData(levelId, form.data.stream_id || undefined);
    }

    function handleStreamSelect(streamId: string) {
        form.setData('stream_id', streamId);
        if (form.data.education_level_id) {
            fetchLevelSubjectsData(form.data.education_level_id, streamId);
        }
    }

    function handleExamGoalToggle(id: string) {
        form.setData((prev) => {
            const goals = prev.exam_goals.includes(id)
                ? prev.exam_goals.filter((g) => g !== id)
                : [...prev.exam_goals, id];
            return { ...prev, exam_goals: goals };
        });
    }

    function handleSubmit() {
        form.post(OnboardingController.store.url());
    }

    const selectedFaculty = faculties.find((f) => f.id === form.data.faculty_id);
    const selectedDepartment = departments.find((d) => d.id === form.data.department_id);
    const selectedCourses = allCourses.filter((c) => form.data.course_ids.includes(c.id));

    const selectedSystem = educationSystems.find((s) => s.id === form.data.education_system_id);
    const selectedLevelName = tiers
        .flatMap((t) => t.education_levels)
        .find((l) => l.id === form.data.education_level_id)
        ?.display_name ?? '';
    const selectedStreamName = streams.find((s) => s.id === form.data.stream_id)?.name ?? '';
    const examGoalNames = assessmentTypes
        .filter((t) => form.data.exam_goals.includes(t.id))
        .map((t) => t.name);

    return (
        <OnboardingLayout currentStep={stepIndex + 1} totalSteps={steps.length}>
            <Head title="Onboarding" />

            {currentStep === 'student_type' && (
                <StudentTypeStep
                    value={form.data.student_type}
                    onSelect={handleStudentTypeSelect}
                    onNext={goNext}
                />
            )}

            {currentStep === 'institution' && (
                <InstitutionStep
                    value={form.data.institution_id}
                    selectedInstitution={selectedInstitution}
                    onSelect={handleInstitutionSelect}
                    onNext={goNext}
                    onBack={goBack}
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
                    levelProgression={levelProgression}
                    loading={loadingLevelProgression}
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

            {currentStep === 'country' && (
                <CountryStep
                    value={selectedCountryId}
                    countries={countries}
                    schoolName={form.data.school_name}
                    stateOrRegion={form.data.state_or_region}
                    onSelect={handleCountrySelect}
                    onSchoolNameChange={(v) => form.setData('school_name', v)}
                    onStateOrRegionChange={(v) => form.setData('state_or_region', v)}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'education_system' && (
                <EducationSystemStep
                    value={form.data.education_system_id}
                    educationSystems={educationSystems}
                    loading={loadingEducationSystems}
                    onSelect={handleEducationSystemSelect}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'secondary_level' && (
                <SecondaryLevelStep
                    value={form.data.education_level_id}
                    tiers={tiers}
                    loading={loadingTiers}
                    onSelect={handleSecondaryLevelSelect}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'stream_subjects' && (
                <StreamSubjectsStep
                    streamValue={form.data.stream_id}
                    streams={streams}
                    subjects={levelSubjects}
                    loading={loadingSubjects}
                    onStreamSelect={handleStreamSelect}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'exam_goals' && (
                <ExamGoalsStep
                    selectedIds={form.data.exam_goals}
                    assessmentTypes={assessmentTypes}
                    loading={loadingAssessmentTypes}
                    onToggle={handleExamGoalToggle}
                    onNext={goNext}
                    onBack={goBack}
                />
            )}

            {currentStep === 'confirm' && (
                <ConfirmStep
                    studentType={form.data.student_type as StudentType}
                    institution={selectedInstitution}
                    facultyName={selectedFaculty?.name ?? ''}
                    departmentName={selectedDepartment?.name ?? ''}
                    level={form.data.level}
                    matricNumber={form.data.matric_number}
                    admissionYear={form.data.admission_year}
                    selectedCourses={selectedCourses}
                    educationSystemName={selectedSystem?.name ?? ''}
                    educationLevelName={selectedLevelName}
                    streamName={selectedStreamName}
                    examGoalNames={examGoalNames}
                    isSubmitting={form.processing}
                    onSubmit={handleSubmit}
                    onBack={goBack}
                />
            )}
        </OnboardingLayout>
    );
}
