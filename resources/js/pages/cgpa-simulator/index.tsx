import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import EmptyState from '@/components/skoolpad/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { store, update } from '@/actions/App/Http/Controllers/Student/CgpaSimulatorController';
import { calculateGpa, calculateProjectedCgpa } from '@/lib/cgpa-calculator';
import type {
    CgpaEnrolledCourse,
    CgpaSimulation,
    CgpaSimulatorPageProps,
    ProjectedGradeEntry,
    SemesterData,
} from '@/types/cgpa';
import { CourseGradeRow } from './partials/course-grade-row';
import { ResultsPanel } from './partials/results-panel';
import { ReverseCalculator } from './partials/reverse-calculator';
import { SimulationList } from './partials/simulation-list';
import { SemesterGpaChart } from './partials/semester-gpa-chart';
import { Calculator, Download, Plus, Save } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const breadcrumbs = [{ title: 'CGPA Simulator', href: '/cgpa-simulator' }];

const EMPTY_ENTRY: ProjectedGradeEntry = { course_code: '', course_title: '', credit_units: 0, grade: '' };

export default function CgpaSimulator({
    simulations,
    gradingScale,
    enrolledCourses,
    isSecondary,
    levelProgression,
}: CgpaSimulatorPageProps) {
    const [currentCgpa, setCurrentCgpa] = useState('');
    const [currentCredits, setCurrentCredits] = useState('');
    const [courses, setCourses] = useState<ProjectedGradeEntry[]>([{ ...EMPTY_ENTRY }]);
    const [simulationName, setSimulationName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [semesters, setSemesters] = useState<SemesterData[]>([]);

    const cgpaNum = parseFloat(currentCgpa) || 0;
    const creditsNum = parseInt(currentCredits) || 0;

    const validCourses = useMemo(
        () => courses.filter((c) => c.grade && c.credit_units > 0),
        [courses],
    );

    const projection = useMemo(() => {
        if (!gradingScale || validCourses.length === 0) {
            return { projectedCgpa: 0, newCredits: 0, newQualityPoints: 0 };
        }
        return calculateProjectedCgpa(
            cgpaNum,
            creditsNum,
            validCourses,
            gradingScale.grade_boundaries,
            gradingScale.scale_max,
        );
    }, [cgpaNum, creditsNum, validCourses, gradingScale]);

    const semestersWithGpa = useMemo(() => {
        if (!gradingScale) return semesters;
        return semesters.map((s) => {
            const valid = s.courses.filter((c) => c.grade && c.credit_units > 0);
            if (valid.length === 0) return s;
            const result = calculateGpa(valid, gradingScale.grade_boundaries);
            return { ...s, gpa: result.gpa, total_credits: result.totalCredits };
        });
    }, [semesters, gradingScale]);

    const handleCourseChange = useCallback(
        (index: number, field: keyof ProjectedGradeEntry, value: string | number) => {
            setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
        },
        [],
    );

    const handleRemoveCourse = useCallback((index: number) => {
        setCourses((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleAddCourse = useCallback(() => {
        setCourses((prev) => [...prev, { ...EMPTY_ENTRY }]);
    }, []);

    function handleImportCourses() {
        if (enrolledCourses.length === 0) return;

        const newEntries: ProjectedGradeEntry[] = enrolledCourses.map((c: CgpaEnrolledCourse) => ({
            course_code: c.course_code,
            course_title: c.course_title,
            credit_units: c.credit_units,
            grade: '',
        }));

        setCourses(newEntries);
    }

    function handleLoadSimulation(sim: CgpaSimulation) {
        setCurrentCgpa(sim.current_cgpa.toString());
        setCurrentCredits(sim.current_credit_hours.toString());
        setCourses(sim.projected_grades.length > 0 ? [...sim.projected_grades] : [{ ...EMPTY_ENTRY }]);
        setSimulationName(sim.name ?? '');
        setEditingId(sim.id);
        setSemesters(sim.semester_data ?? []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleSave() {
        if (!gradingScale || validCourses.length === 0) return;
        setSaving(true);

        const payload = {
            name: simulationName || null,
            mode: 'quick',
            current_cgpa: cgpaNum,
            current_credit_hours: creditsNum,
            projected_grades: validCourses,
            semester_data: semesters.length > 0 ? semesters : null,
            target_cgpa: null,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        };

        if (editingId) {
            router.put(update(editingId).url, payload as never, options);
        } else {
            router.post(store().url, payload as never, options);
        }
    }

    function handleNewSimulation() {
        setCurrentCgpa('');
        setCurrentCredits('');
        setCourses([{ ...EMPTY_ENTRY }]);
        setSimulationName('');
        setEditingId(null);
        setSemesters([]);
    }

    if (isSecondary) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="CGPA Simulator" />
                <div className="flex flex-col gap-4 p-4 md:p-6">
                    <EmptyState
                        icon="🎓"
                        title="Not Available"
                        description="The CGPA Simulator is designed for tertiary students with credit-based grading systems."
                    />
                </div>
            </AppLayout>
        );
    }

    if (!gradingScale) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="CGPA Simulator" />
                <div className="flex flex-col gap-4 p-4 md:p-6">
                    <EmptyState
                        icon="⚙️"
                        title="Grading Scale Not Found"
                        description="Your institution's grading scale hasn't been set up yet. Please contact your institution administrator."
                    />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CGPA Simulator" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1
                            className="text-2xl font-bold tracking-tight"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            CGPA Simulator
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Simulate your projected CGPA with different grade scenarios.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {editingId && (
                            <Button variant="outline" size="sm" onClick={handleNewSimulation}>
                                <Plus className="mr-1.5 size-4" />
                                New
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
                    {/* Left: Calculator */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calculator className="size-4 text-muted-foreground" />
                                    {editingId ? `Editing: ${simulationName || 'Untitled'}` : 'Grade Calculator'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <FormField label="Simulation Name" name="name">
                                        <Input
                                            id="name"
                                            placeholder="e.g. Best Case"
                                            value={simulationName}
                                            onChange={(e) => setSimulationName(e.target.value)}
                                        />
                                    </FormField>
                                    <FormField label="Current CGPA" name="current_cgpa" required>
                                        <Input
                                            id="current_cgpa"
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            max={gradingScale.scale_max}
                                            placeholder={`0 – ${gradingScale.scale_max}`}
                                            value={currentCgpa}
                                            onChange={(e) => setCurrentCgpa(e.target.value)}
                                        />
                                    </FormField>
                                    <FormField label="Total Credit Hours" name="current_credit_hours" required>
                                        <Input
                                            id="current_credit_hours"
                                            type="number"
                                            min={0}
                                            max={500}
                                            placeholder="e.g. 60"
                                            value={currentCredits}
                                            onChange={(e) => setCurrentCredits(e.target.value)}
                                        />
                                    </FormField>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Projected Courses</p>
                                        <p className="text-xs text-muted-foreground">
                                            {gradingScale.name}
                                        </p>
                                    </div>

                                    <div className="hidden grid-cols-[1fr_1fr_80px_100px_32px] gap-2 sm:grid">
                                        <p className="text-xs text-muted-foreground">Code</p>
                                        <p className="text-xs text-muted-foreground">Title</p>
                                        <p className="text-center text-xs text-muted-foreground">Units</p>
                                        <p className="text-xs text-muted-foreground">Grade</p>
                                        <div />
                                    </div>

                                    <div className="space-y-2">
                                        {courses.map((entry, index) => (
                                            <CourseGradeRow
                                                key={index}
                                                entry={entry}
                                                index={index}
                                                gradeBoundaries={gradingScale.grade_boundaries}
                                                onChange={handleCourseChange}
                                                onRemove={handleRemoveCourse}
                                                canRemove={courses.length > 1}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleAddCourse}>
                                            <Plus className="mr-1.5 size-4" />
                                            Add Course
                                        </Button>
                                        {enrolledCourses.length > 0 && (
                                            <Button variant="outline" size="sm" onClick={handleImportCourses}>
                                                <Download className="mr-1.5 size-4" />
                                                Import Enrolled
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end border-t border-border pt-4">
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving || validCourses.length === 0}
                                        size="sm"
                                    >
                                        <Save className="mr-1.5 size-4" />
                                        {saving ? 'Saving...' : editingId ? 'Update Simulation' : 'Save Simulation'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <ResultsPanel
                            projectedCgpa={projection.projectedCgpa}
                            currentCgpa={cgpaNum}
                            scaleMax={gradingScale.scale_max}
                            classificationLabels={gradingScale.classification_labels}
                            newCredits={projection.newCredits}
                        />

                        {semestersWithGpa.length > 0 && (
                            <SemesterGpaChart
                                semesters={semestersWithGpa}
                                scaleMax={gradingScale.scale_max}
                            />
                        )}
                    </div>

                    {/* Right: Saved Simulations + Reverse Calculator */}
                    <div className="space-y-4">
                        <SimulationList simulations={simulations} onLoad={handleLoadSimulation} />

                        <ReverseCalculator
                            currentCgpa={cgpaNum}
                            currentCredits={creditsNum}
                            scaleMax={gradingScale.scale_max}
                            classificationLabels={gradingScale.classification_labels}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
