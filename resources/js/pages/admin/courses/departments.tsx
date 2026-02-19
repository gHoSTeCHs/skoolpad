import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Info, Loader2, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import CourseDepartmentController from '@/actions/App/Http/Controllers/Admin/CourseDepartmentController';
import CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';
import type { CourseScope } from '@/types/courses';
import type { DepartmentOffering, FacultyWithDepartments, OfferingPayloadItem } from '@/types/departments';

interface CourseInfo {
    id: string;
    course_code: string;
    course_title: string;
    course_scope: CourseScope;
    institution: { name: string };
}

interface Props {
    course: CourseInfo;
    scope_type: 'department' | 'faculty' | 'institution_wide';
    message: string | null;
    faculties: FacultyWithDepartments[];
}

function buildInitialOfferings(faculties: FacultyWithDepartments[]): OfferingPayloadItem[] {
    return faculties.flatMap((f) =>
        f.departments
            .filter((d) => d.is_offered)
            .map((d) => ({ department_id: d.id, is_compulsory: d.is_compulsory })),
    );
}

export default function AdminCourseDepartments({ course, scope_type, message, faculties }: Props) {
    const [offerings, setOfferings] = useState<OfferingPayloadItem[]>(() => buildInitialOfferings(faculties));
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: 'Courses', href: '/admin/courses' },
        { title: 'Edit', href: CourseController.edit.url(course.id) },
        { title: 'Departments', href: '#' },
    ];

    const offeredSet = useMemo(() => new Set(offerings.map((o) => o.department_id)), [offerings]);
    const compulsorySet = useMemo(
        () => new Set(offerings.filter((o) => o.is_compulsory).map((o) => o.department_id)),
        [offerings],
    );

    const summary = useMemo(() => {
        const compulsory = offerings.filter((o) => o.is_compulsory).length;
        return { total: offerings.length, compulsory, elective: offerings.length - compulsory };
    }, [offerings]);

    function toggleDepartment(departmentId: string) {
        setOfferings((prev) => {
            if (prev.some((o) => o.department_id === departmentId)) {
                return prev.filter((o) => o.department_id !== departmentId);
            }
            return [...prev, { department_id: departmentId, is_compulsory: false }];
        });
    }

    function toggleCompulsory(departmentId: string, isCompulsory: boolean) {
        setOfferings((prev) => prev.map((o) => (o.department_id === departmentId ? { ...o, is_compulsory: isCompulsory } : o)));
    }

    function toggleAllInFaculty(faculty: FacultyWithDepartments) {
        const allSelected = faculty.departments.every((d) => offeredSet.has(d.id));
        setOfferings((prev) => {
            const facultyDeptIds = new Set(faculty.departments.map((d) => d.id));
            const withoutFaculty = prev.filter((o) => !facultyDeptIds.has(o.department_id));
            if (allSelected) {
                return withoutFaculty;
            }
            const toAdd = faculty.departments
                .filter((d) => !prev.some((o) => o.department_id === d.id))
                .map((d) => ({ department_id: d.id, is_compulsory: false }));
            return [...prev, ...toAdd];
        });
    }

    function handleSave() {
        setProcessing(true);
        router.put(
            CourseDepartmentController.update.url(course.id),
            { offerings },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Department Offerings — ${course.course_code}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
                        <Link href={CourseController.edit.url(course.id)}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            Offerings for {course.course_code} — {course.course_title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">{course.institution.name}</p>
                    </div>
                </div>

                {scope_type !== 'faculty' && message && (
                    <Alert>
                        <Info className="size-4" />
                        <AlertTitle>No Configuration Needed</AlertTitle>
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}

                {scope_type === 'faculty' && (
                    <>
                        <div className="flex flex-col gap-4">
                            {faculties.map((faculty) => {
                                const allSelected = faculty.departments.every((d) => offeredSet.has(d.id));
                                const someSelected = faculty.departments.some((d) => offeredSet.has(d.id));

                                return (
                                    <FacultyCard
                                        key={faculty.id}
                                        faculty={faculty}
                                        allSelected={allSelected}
                                        someSelected={someSelected}
                                        offeredSet={offeredSet}
                                        compulsorySet={compulsorySet}
                                        onToggleAll={() => toggleAllInFaculty(faculty)}
                                        onToggleDepartment={toggleDepartment}
                                        onToggleCompulsory={toggleCompulsory}
                                    />
                                );
                            })}
                        </div>

                        <div className="bg-muted/50 sticky bottom-0 flex items-center justify-between rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">
                                {summary.total} department{summary.total !== 1 ? 's' : ''} selected
                                {summary.total > 0 && (
                                    <span>
                                        {' '}
                                        ({summary.compulsory} compulsory, {summary.elective} elective)
                                    </span>
                                )}
                            </p>
                            <Button onClick={handleSave} disabled={processing}>
                                {processing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                                Save Offerings
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

function FacultyCard({
    faculty,
    allSelected,
    someSelected,
    offeredSet,
    compulsorySet,
    onToggleAll,
    onToggleDepartment,
    onToggleCompulsory,
}: {
    faculty: FacultyWithDepartments;
    allSelected: boolean;
    someSelected: boolean;
    offeredSet: Set<string>;
    compulsorySet: Set<string>;
    onToggleAll: () => void;
    onToggleDepartment: (id: string) => void;
    onToggleCompulsory: (id: string, value: boolean) => void;
}) {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">{faculty.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={onToggleAll}>
                    {allSelected ? 'Deselect all' : someSelected ? 'Select remaining' : 'Select all'}
                </Button>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
                {faculty.departments.map((dept) => (
                    <DepartmentRow
                        key={dept.id}
                        department={dept}
                        isOffered={offeredSet.has(dept.id)}
                        isCompulsory={compulsorySet.has(dept.id)}
                        onToggleOffered={() => onToggleDepartment(dept.id)}
                        onToggleCompulsory={(val) => onToggleCompulsory(dept.id, val)}
                    />
                ))}
            </CardContent>
        </Card>
    );
}

function DepartmentRow({
    department,
    isOffered,
    isCompulsory,
    onToggleOffered,
    onToggleCompulsory,
}: {
    department: DepartmentOffering;
    isOffered: boolean;
    isCompulsory: boolean;
    onToggleOffered: () => void;
    onToggleCompulsory: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <Checkbox checked={isOffered} onCheckedChange={onToggleOffered} />
                <span className="text-sm font-medium">{department.name}</span>
                {department.abbreviation && (
                    <span className="text-xs text-muted-foreground">({department.abbreviation})</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{isOffered && isCompulsory ? 'Compulsory' : isOffered ? 'Elective' : ''}</span>
                <Switch size="sm" checked={isCompulsory} onCheckedChange={onToggleCompulsory} disabled={!isOffered} />
            </div>
        </div>
    );
}
