import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CourseOption {
    id: string;
    course_code: string;
    course_title: string;
}

type PaperSource = 'university' | 'assessment';

interface Props {
    institutions: { id: string; name: string; abbreviation: string }[];
    assessment_types: { id: string; name: string }[];
}

const breadcrumbs = [
    { title: 'Question Papers', href: '/admin/question-papers' },
    { title: 'Create', href: '/admin/question-papers/create' },
];

const sourceOptions: { value: PaperSource; label: string; description: string }[] = [
    { value: 'university', label: 'University Course', description: 'Paper linked to a specific institution course.' },
    { value: 'assessment', label: 'Assessment Type', description: 'Paper linked to a standardised assessment.' },
];

export default function AdminQuestionPapersCreate({ institutions, assessment_types }: Props) {
    const [paperSource, setPaperSource] = useState<PaperSource>('university');
    const [institutionId, setInstitutionId] = useState('');
    const [courses, setCourses] = useState<CourseOption[]>([]);

    const form = useForm({
        title: '',
        institution_course_id: '',
        assessment_type_id: '',
        academic_session: '',
        semester: '',
        year: '' as string | number,
        total_marks: '' as string | number,
        duration_minutes: '' as string | number,
        instructions: '',
    });

    useEffect(() => {
        if (!institutionId) {
            setCourses([]);
            form.setData('institution_course_id', '');
            return;
        }

        fetch(`/admin/api/institutions/${institutionId}/courses`)
            .then((res) => res.json())
            .then((data: CourseOption[]) => setCourses(data))
            .catch(() => setCourses([]));

        form.setData('institution_course_id', '');
    }, [institutionId]);

    function handleSourceChange(source: PaperSource) {
        setPaperSource(source);
        if (source === 'university') {
            form.setData('assessment_type_id', '');
        } else {
            setInstitutionId('');
            setCourses([]);
            form.setData('institution_course_id', '');
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(QuestionPaperController.store.url());
    }

    return (
        <FormPageLayout
            title="Create Question Paper"
            description="Create a new question paper, then build its sections and questions."
            breadcrumbs={breadcrumbs}
            maxWidth="max-w-3xl"
        >
            <FormWrapper
                onSubmit={handleSubmit}
                cancelUrl={QuestionPaperController.index.url()}
                submitLabel="Create Paper"
                isSubmitting={form.processing}
            >
                <FormField label="Title" name="title" error={form.errors.title} required>
                    <Input
                        id="title"
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        placeholder="e.g. CSC 201 Final Exam 2024/2025"
                    />
                </FormField>

                <div className="space-y-3">
                    <span className="text-sm font-medium">Paper Source</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {sourceOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSourceChange(option.value)}
                                className={cn(
                                    'rounded-lg border-2 p-4 text-left transition-colors',
                                    paperSource === option.value
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border hover:border-muted-foreground/30',
                                )}
                            >
                                <span className="block text-sm font-medium">{option.label}</span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    {option.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {paperSource === 'university' && (
                    <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="Institution" name="institution_id" error={form.errors.institution_course_id}>
                            <Select value={institutionId} onValueChange={setInstitutionId}>
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
                        </FormField>

                        <FormField label="Course" name="institution_course_id" error={form.errors.institution_course_id}>
                            <Select
                                value={form.data.institution_course_id}
                                onValueChange={(value) => form.setData('institution_course_id', value)}
                                disabled={!institutionId || courses.length === 0}
                            >
                                <SelectTrigger id="institution_course_id">
                                    <SelectValue
                                        placeholder={
                                            !institutionId
                                                ? 'Select an institution first'
                                                : courses.length === 0
                                                  ? 'No courses found'
                                                  : 'Select course'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.course_code} — {c.course_title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                )}

                {paperSource === 'assessment' && (
                    <FormField label="Assessment Type" name="assessment_type_id" error={form.errors.assessment_type_id}>
                        <Select
                            value={form.data.assessment_type_id}
                            onValueChange={(value) => form.setData('assessment_type_id', value)}
                        >
                            <SelectTrigger id="assessment_type_id">
                                <SelectValue placeholder="Select assessment type" />
                            </SelectTrigger>
                            <SelectContent>
                                {assessment_types.map((at) => (
                                    <SelectItem key={at.id} value={at.id}>
                                        {at.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                    <FormField label="Academic Session" name="academic_session" error={form.errors.academic_session}>
                        <Input
                            id="academic_session"
                            value={form.data.academic_session}
                            onChange={(e) => form.setData('academic_session', e.target.value)}
                            placeholder="e.g. 2024/2025"
                        />
                    </FormField>

                    <FormField label="Semester" name="semester" error={form.errors.semester}>
                        <Select
                            value={form.data.semester}
                            onValueChange={(value) => form.setData('semester', value)}
                        >
                            <SelectTrigger id="semester">
                                <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="first">First Semester</SelectItem>
                                <SelectItem value="second">Second Semester</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    <FormField label="Year" name="year" error={form.errors.year}>
                        <Input
                            id="year"
                            type="number"
                            min={1990}
                            max={new Date().getFullYear() + 1}
                            value={form.data.year}
                            onChange={(e) => form.setData('year', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 2024"
                        />
                    </FormField>

                    <FormField label="Total Marks" name="total_marks" error={form.errors.total_marks}>
                        <Input
                            id="total_marks"
                            type="number"
                            min={1}
                            value={form.data.total_marks}
                            onChange={(e) => form.setData('total_marks', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 100"
                        />
                    </FormField>

                    <FormField label="Duration (minutes)" name="duration_minutes" error={form.errors.duration_minutes}>
                        <Input
                            id="duration_minutes"
                            type="number"
                            min={1}
                            value={form.data.duration_minutes}
                            onChange={(e) => form.setData('duration_minutes', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g. 120"
                        />
                    </FormField>
                </div>

                <FormField label="Instructions" name="instructions" error={form.errors.instructions}>
                    <Textarea
                        id="instructions"
                        value={form.data.instructions}
                        onChange={(e) => form.setData('instructions', e.target.value)}
                        placeholder="General instructions for candidates..."
                        rows={4}
                    />
                </FormField>
            </FormWrapper>
        </FormPageLayout>
    );
}
