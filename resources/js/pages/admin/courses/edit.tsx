import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import CourseDepartmentController from '@/actions/App/Http/Controllers/Admin/CourseDepartmentController';
import CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
import { structure } from '@/routes/admin/api/institution';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type {
    CourseData,
    CourseFormData,
    CourseLevel,
    CourseScope,
    CourseScopeOption,
    CourseSemester,
    DepartmentOption,
    DisciplineOption,
    FacultyOption,
    InstitutionOption,
    SemesterOption,
} from '@/types/courses';

interface Props {
    course: CourseData;
    institutions: InstitutionOption[];
    disciplines: DisciplineOption[];
    levels: CourseLevel[];
    course_scopes: CourseScopeOption[];
    semesters: SemesterOption[];
    faculties: FacultyOption[];
    departments: DepartmentOption[];
}

const breadcrumbs = [
    { title: 'Courses', href: '/admin/courses' },
    { title: 'Edit', href: '#' },
];

const scopeDescriptions: Record<CourseScope, string> = {
    department: 'Offered only within the owning department.',
    faculty: 'Available to all departments in the faculty.',
    institution_wide: 'Open to students across the entire institution.',
};

export default function AdminCoursesEdit({
    course,
    institutions,
    disciplines,
    levels,
    course_scopes,
    semesters,
    faculties: initialFaculties,
    departments: initialDepartments,
}: Props) {
    const [faculties, setFaculties] = useState<FacultyOption[]>(initialFaculties);
    const [departments, setDepartments] = useState<DepartmentOption[]>(initialDepartments);
    const [loadingStructure, setLoadingStructure] = useState(false);

    const form = useForm<CourseFormData>({
        institution_id: course.institution_id,
        owning_department_id: course.owning_department_id,
        discipline_id: course.discipline_id,
        course_code: course.course_code,
        course_title: course.course_title,
        level: course.level,
        semester: course.semester,
        credit_units: course.credit_units ?? '',
        is_elective: course.is_elective,
        course_scope: course.course_scope,
        description: course.description ?? '',
    });

    const fetchInstitutionStructure = useCallback(async (institutionId: string) => {
        setLoadingStructure(true);
        try {
            const response = await fetch(structure.url(institutionId));
            const data = await response.json();
            setFaculties(data.faculties);
            setDepartments(data.departments);
        } finally {
            setLoadingStructure(false);
        }
    }, []);

    function handleInstitutionChange(value: string) {
        form.setData((prev) => ({ ...prev, institution_id: value, owning_department_id: '' }));
        setFaculties([]);
        setDepartments([]);
        if (value) {
            fetchInstitutionStructure(value);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(CourseController.update.url(course.id));
    }

    const departmentsByFaculty = faculties.map((faculty) => ({
        faculty,
        departments: departments.filter((d) => d.faculty_id === faculty.id),
    }));

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Course" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Course</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="institution_id">Institution</Label>
                                    <Select
                                        value={form.data.institution_id}
                                        onValueChange={handleInstitutionChange}
                                    >
                                        <SelectTrigger id="institution_id">
                                            <SelectValue placeholder="Select institution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {institutions.map((inst) => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.name} ({inst.abbreviation})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.institution_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discipline_id">Discipline</Label>
                                    <Select
                                        value={form.data.discipline_id}
                                        onValueChange={(value) => form.setData('discipline_id', value)}
                                    >
                                        <SelectTrigger id="discipline_id">
                                            <SelectValue placeholder="Select discipline" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {disciplines.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>
                                                    {d.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.discipline_id} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="owning_department_id">
                                    Owning Department
                                    {loadingStructure && <Loader2 className="ml-2 inline size-3.5 animate-spin" />}
                                </Label>
                                <Select
                                    value={form.data.owning_department_id}
                                    onValueChange={(value) => form.setData('owning_department_id', value)}
                                    disabled={!form.data.institution_id || loadingStructure}
                                >
                                    <SelectTrigger id="owning_department_id">
                                        <SelectValue
                                            placeholder={
                                                !form.data.institution_id
                                                    ? 'Select an institution first'
                                                    : loadingStructure
                                                      ? 'Loading departments...'
                                                      : 'Select department'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentsByFaculty.map((group) => (
                                            <SelectGroup key={group.faculty.id}>
                                                <SelectLabel>{group.faculty.name}</SelectLabel>
                                                {group.departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                        {dept.abbreviation && ` (${dept.abbreviation})`}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.owning_department_id} />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="course_code">Course Code</Label>
                                    <Input
                                        id="course_code"
                                        value={form.data.course_code}
                                        onChange={(e) => form.setData('course_code', e.target.value)}
                                        placeholder="e.g. CSC 201"
                                    />
                                    <InputError message={form.errors.course_code} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="course_title">Course Title</Label>
                                    <Input
                                        id="course_title"
                                        value={form.data.course_title}
                                        onChange={(e) => form.setData('course_title', e.target.value)}
                                        placeholder="e.g. Introduction to Computer Science"
                                    />
                                    <InputError message={form.errors.course_title} />
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="level">Level</Label>
                                    <Select
                                        value={form.data.level === '' ? '' : String(form.data.level)}
                                        onValueChange={(value) => form.setData('level', Number(value) as CourseLevel)}
                                    >
                                        <SelectTrigger id="level">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {levels.map((lvl) => (
                                                <SelectItem key={lvl} value={String(lvl)}>
                                                    {lvl} Level
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.level} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="semester">Semester</Label>
                                    <Select
                                        value={form.data.semester}
                                        onValueChange={(value) => form.setData('semester', value as CourseSemester)}
                                    >
                                        <SelectTrigger id="semester">
                                            <SelectValue placeholder="Select semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {semesters.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.semester} />
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="credit_units">Credit Units</Label>
                                    <Input
                                        id="credit_units"
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={form.data.credit_units}
                                        onChange={(e) => form.setData('credit_units', e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="e.g. 3"
                                    />
                                    <InputError message={form.errors.credit_units} />
                                </div>
                                <div className="flex items-end pb-2">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="is_elective"
                                            checked={form.data.is_elective}
                                            onCheckedChange={(checked) => form.setData('is_elective', checked)}
                                        />
                                        <Label htmlFor="is_elective">Elective Course</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Course Scope</Label>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {course_scopes.map((scope) => (
                                        <button
                                            key={scope.value}
                                            type="button"
                                            onClick={() => form.setData('course_scope', scope.value)}
                                            className={cn(
                                                'rounded-lg border-2 p-4 text-left transition-colors',
                                                form.data.course_scope === scope.value
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                    : 'border-border hover:border-muted-foreground/30',
                                            )}
                                        >
                                            <span className="block text-sm font-medium">{scope.label}</span>
                                            <span className="mt-1 block text-xs text-muted-foreground">
                                                {scopeDescriptions[scope.value]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <InputError message={form.errors.course_scope} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    placeholder="Brief description of the course..."
                                    rows={3}
                                />
                                <InputError message={form.errors.description} />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 border-t pt-6">
                            <Button variant="outline" asChild>
                                <Link href={CourseController.index.url()}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Update Course
                            </Button>
                        </CardFooter>
                    </Card>
                </form>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="font-medium">Manage Topic Mappings</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Link canonical topics to this course.
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                                <a href="#">
                                    <ArrowRight className="size-4" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="font-medium">Manage Department Offerings</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Configure which departments offer this course.
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={CourseDepartmentController.index.url(course.id)}>
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
