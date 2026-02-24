import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Camera, ClipboardCheck, Eye, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReviewQueueController from '@/actions/App/Http/Controllers/Admin/ReviewQueueController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { McqOptionsBuilder } from '@/components/admin/mcq-options-builder';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFilterHandlers } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import type { PaginatedData } from '@/types/models';
import type { CourseOption, EnumOption, InstitutionOption, TopicSearchResult } from '@/types/questions';
import type { ReviewQueueFilters, TranscribeQuestionForm, UploadListItem } from '@/types/review-queue';

interface Props {
    submissions: PaginatedData<UploadListItem>;
    filters: ReviewQueueFilters;
    statuses: EnumOption[];
    institutions: InstitutionOption[];
    enum_options: {
        question_types: { value: string; label: string }[];
        difficulties: { value: string; label: string }[];
        semesters: { value: string; label: string }[];
    };
}

const breadcrumbs = [{ title: 'Review Queue', href: '/admin/review-queue' }];

const statusStyles: Record<string, string> = {
    pending: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)] hover:bg-[var(--badge-reward-bg)] border-[var(--badge-reward-fg)]/10',
    approved: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)] border-[var(--badge-primary-fg)]/10',
    rejected: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)] hover:bg-[var(--badge-danger-bg)] border-[var(--badge-danger-fg)]/10',
};

const columns: ColumnDef<UploadListItem>[] = [
    {
        id: 'submitted_by_name',
        header: 'Contributor',
        cell: (row) => (
            <span className="font-body text-sm font-medium tracking-tight text-foreground">
                {row.submitted_by_name}
            </span>
        ),
    },
    {
        id: 'course_code',
        header: 'Context',
        cell: (row) => (
            <div className="space-y-0.5">
                <span className="block font-body text-sm font-semibold tracking-tight">
                    {row.course_code ?? '—'}
                </span>
                {row.institution_abbreviation && (
                    <span className="block font-body text-xs font-medium tracking-wide text-muted-foreground/70">
                        {row.institution_abbreviation}
                    </span>
                )}
            </div>
        ),
    },
    {
        id: 'has_images',
        header: 'Media',
        cell: (row) => row.has_images ? (
            <div className="flex items-center justify-center">
                <Camera className="size-4 text-canopy-600 dark:text-canopy-400 reader:text-canopy-400" strokeWidth={2} />
            </div>
        ) : (
            <span className="text-muted-foreground/40">—</span>
        ),
        align: 'center',
    },
    {
        id: 'exam_year',
        header: 'Year',
        cell: (row) => (
            <span className="font-body text-sm text-foreground">
                {row.exam_year ?? '—'}
            </span>
        ),
    },
    {
        id: 'status',
        header: 'Status',
        cell: (row) => (
            <Badge
                variant="secondary"
                className={`${statusStyles[row.status] ?? ''} border font-medium tracking-tight transition-all duration-200 hover:scale-[1.02]`}
            >
                {row.status_label}
            </Badge>
        ),
    },
    {
        id: 'created_at',
        header: 'Submitted',
        cell: (row) => (
            <time className="font-body text-sm text-muted-foreground">
                {formatDate(row.created_at)}
            </time>
        ),
    },
];

function emptyQuestion(): TranscribeQuestionForm {
    return {
        institution_course_id: '',
        question_type: 'mcq',
        content: '',
        year: '',
        semester: '',
        difficulty_level: '',
        topic_id: '',
        options: [
            { content: '', is_correct: false },
            { content: '', is_correct: false },
            { content: '', is_correct: false },
            { content: '', is_correct: false },
        ],
    };
}

export default function AdminReviewQueueUploads({ submissions, filters, statuses, institutions, enum_options }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: ReviewQueueController.uploads.url(),
        filters,
    });

    const [activeSubmission, setActiveSubmission] = useState<UploadListItem | null>(null);
    const [institutionId, setInstitutionId] = useState('');
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [topicResults, setTopicResults] = useState<TopicSearchResult[]>([]);
    const [topicQuery, setTopicQuery] = useState('');

    const form = useForm<{ questions: TranscribeQuestionForm[] }>({
        questions: [emptyQuestion()],
    });

    useEffect(() => {
        if (!institutionId) {
            setCourses([]);
            return;
        }

        fetch(`/admin/api/institutions/${institutionId}/courses`)
            .then((res) => res.json())
            .then((data: CourseOption[]) => setCourses(data))
            .catch(() => setCourses([]));
    }, [institutionId]);

    useEffect(() => {
        if (topicQuery.length < 2) {
            setTopicResults([]);
            return;
        }

        const timer = setTimeout(() => {
            fetch(`/admin/api/topics/search?q=${encodeURIComponent(topicQuery)}`)
                .then((res) => res.json())
                .then((data: TopicSearchResult[]) => setTopicResults(data))
                .catch(() => setTopicResults([]));
        }, 300);

        return () => clearTimeout(timer);
    }, [topicQuery]);

    function startTranscription(item: UploadListItem) {
        setActiveSubmission(item);
        form.setData('questions', [emptyQuestion()]);
        setInstitutionId('');
        setCourses([]);
    }

    function updateQuestion(index: number, field: keyof TranscribeQuestionForm, value: unknown) {
        const updated = [...form.data.questions];
        updated[index] = { ...updated[index], [field]: value };
        form.setData('questions', updated);
    }

    function addQuestion() {
        form.setData('questions', [...form.data.questions, emptyQuestion()]);
    }

    function removeQuestion(index: number) {
        if (form.data.questions.length <= 1) return;
        form.setData('questions', form.data.questions.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!activeSubmission) return;

        form.post(ReviewQueueController.transcribe.url(activeSubmission.id), {
            onSuccess: () => setActiveSubmission(null),
        });
    }

    if (activeSubmission) {
        return (
            <AdminLayout breadcrumbs={[...breadcrumbs, { title: 'Transcribe Upload', href: '#' }]}>
                <Head title="Transcribe Upload" />
                <div className="flex flex-col gap-6 p-4 md:p-6">
                    <header
                        className="flex items-center gap-4 border-b border-border/40 pb-6"
                        style={{ animation: 'fadeInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveSubmission(null)}
                            className="transition-all duration-200 hover:scale-110 hover:bg-canopy-100 hover:text-canopy-700 dark:hover:bg-canopy-900/30 dark:hover:text-canopy-400"
                        >
                            <ArrowLeft className="size-4" strokeWidth={2} />
                        </Button>
                        <div className="flex-1">
                            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                                Transcription Workspace
                            </h1>
                            <p className="mt-1 font-body text-sm text-muted-foreground">
                                Converting uploaded images to structured question data
                            </p>
                        </div>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
                        <aside className="flex flex-col gap-6" style={{ animation: 'fadeInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards' }}>
                            <Card className="border-border/60 shadow-sm lg:sticky lg:top-6">
                                <CardHeader className="border-b border-border/40 bg-gradient-to-br from-canopy-50/50 to-muted/30 dark:from-canopy-950/20 dark:to-muted/20">
                                    <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                        Reference Images
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {activeSubmission.images && activeSubmission.images.length > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            {activeSubmission.images.map((image, idx) => (
                                                <a
                                                    key={idx}
                                                    href={image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative overflow-hidden rounded-lg border-2 border-border/40 transition-all duration-300 hover:border-canopy-500/40 hover:shadow-lg"
                                                >
                                                    <img
                                                        src={image}
                                                        alt={`Upload ${idx + 1}`}
                                                        className="w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                                        <span className="font-body text-xs font-semibold text-white">
                                                            Click to enlarge
                                                        </span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="py-8 text-center font-body text-sm italic text-muted-foreground">
                                            No images available
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="border-b border-border/40 bg-muted/20">
                                    <CardTitle className="font-display text-base font-semibold tracking-tight">
                                        Submission Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <dl className="space-y-3 text-sm">
                                        <div className="flex justify-between gap-3">
                                            <dt className="font-body font-medium text-muted-foreground">Contributor</dt>
                                            <dd className="font-body font-semibold text-foreground">{activeSubmission.submitted_by_name}</dd>
                                        </div>
                                        {activeSubmission.course_code && (
                                            <div className="flex justify-between gap-3 border-t border-border/30 pt-3">
                                                <dt className="font-body font-medium text-muted-foreground">Course</dt>
                                                <dd className="font-body font-semibold text-foreground">{activeSubmission.course_code}</dd>
                                            </div>
                                        )}
                                        {activeSubmission.exam_year && (
                                            <div className="flex justify-between gap-3 border-t border-border/30 pt-3">
                                                <dt className="font-body font-medium text-muted-foreground">Year</dt>
                                                <dd className="font-body font-semibold text-foreground">{activeSubmission.exam_year}</dd>
                                            </div>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>
                        </aside>

                        <form onSubmit={handleSubmit} style={{ animation: 'fadeInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards' }}>
                            <div className="flex flex-col gap-6">
                                <Card className="border-2 border-canopy-200/40 shadow-md dark:border-canopy-800/30">
                                    <CardHeader className="border-b border-border/40 bg-gradient-to-br from-canopy-50/50 to-honey-50/30 dark:from-canopy-950/20 dark:to-honey-950/10">
                                        <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                            Course Context
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div className="space-y-2.5">
                                                <Label className="font-body text-sm font-semibold text-foreground">
                                                    Institution
                                                </Label>
                                                <Select value={institutionId} onValueChange={setInstitutionId}>
                                                    <SelectTrigger className="border-border/60 bg-background/50 font-body text-sm shadow-none transition-all duration-200 hover:border-border hover:bg-background">
                                                        <SelectValue placeholder="Select institution" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {institutions.map((inst) => (
                                                            <SelectItem key={inst.id} value={inst.id} className="font-body text-sm">
                                                                {inst.name} ({inst.abbreviation})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2.5">
                                                <Label className="font-body text-sm font-semibold text-foreground">
                                                    Course
                                                </Label>
                                                <Select
                                                    value={form.data.questions[0]?.institution_course_id ?? ''}
                                                    onValueChange={(value) => {
                                                        const updated = form.data.questions.map((q) => ({
                                                            ...q,
                                                            institution_course_id: value,
                                                        }));
                                                        form.setData('questions', updated);
                                                    }}
                                                    disabled={!institutionId || courses.length === 0}
                                                >
                                                    <SelectTrigger className="border-border/60 bg-background/50 font-body text-sm shadow-none transition-all duration-200 hover:border-border hover:bg-background disabled:opacity-50">
                                                        <SelectValue placeholder="Select course" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {courses.map((c) => (
                                                            <SelectItem key={c.id} value={c.id} className="font-body text-sm">
                                                                {c.course_code} — {c.course_title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {form.data.questions.map((question, qIdx) => (
                                    <Card
                                        key={qIdx}
                                        className="border-border/60 shadow-sm transition-all duration-300 hover:shadow-md"
                                        style={{
                                            animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${0.05 * qIdx}s backwards`,
                                        }}
                                    >
                                        <CardHeader className="border-b border-border/40 bg-muted/20">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                                    Question {qIdx + 1}
                                                </CardTitle>
                                                {form.data.questions.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground transition-all duration-200 hover:scale-110 hover:text-destructive"
                                                        onClick={() => removeQuestion(qIdx)}
                                                    >
                                                        <Minus className="size-4" strokeWidth={2.5} />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-5 pt-6">
                                            <div className="space-y-2.5">
                                                <Label htmlFor={`content-${qIdx}`} className="font-body text-sm font-semibold text-foreground">
                                                    Question Content
                                                </Label>
                                                <Textarea
                                                    id={`content-${qIdx}`}
                                                    value={question.content}
                                                    onChange={(e) => updateQuestion(qIdx, 'content', e.target.value)}
                                                    rows={4}
                                                    placeholder="Type the question exactly as it appears..."
                                                    className="border-border/60 font-body text-sm leading-relaxed focus:border-canopy-500/40 focus:ring-canopy-500/20"
                                                />
                                                <InputError message={form.errors[`questions.${qIdx}.content`]} />
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div className="space-y-2.5">
                                                    <Label className="font-body text-sm font-semibold text-foreground">
                                                        Question Type
                                                    </Label>
                                                    <Select
                                                        value={question.question_type}
                                                        onValueChange={(value) => updateQuestion(qIdx, 'question_type', value)}
                                                    >
                                                        <SelectTrigger className="border-border/60 bg-background/50 font-body text-sm shadow-none transition-all duration-200 hover:border-border hover:bg-background">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {enum_options.question_types.map((t) => (
                                                                <SelectItem key={t.value} value={t.value} className="font-body text-sm">
                                                                    {t.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError message={form.errors[`questions.${qIdx}.question_type`]} />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label className="font-body text-sm font-semibold text-foreground">
                                                        Difficulty Level
                                                    </Label>
                                                    <Select
                                                        value={question.difficulty_level}
                                                        onValueChange={(value) => updateQuestion(qIdx, 'difficulty_level', value)}
                                                    >
                                                        <SelectTrigger className="border-border/60 bg-background/50 font-body text-sm shadow-none transition-all duration-200 hover:border-border hover:bg-background">
                                                            <SelectValue placeholder="Select difficulty" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {enum_options.difficulties.map((d) => (
                                                                <SelectItem key={d.value} value={d.value} className="font-body text-sm">
                                                                    {d.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div className="space-y-2.5">
                                                    <Label htmlFor={`year-${qIdx}`} className="font-body text-sm font-semibold text-foreground">
                                                        Exam Year
                                                    </Label>
                                                    <Input
                                                        id={`year-${qIdx}`}
                                                        type="number"
                                                        min={1990}
                                                        max={new Date().getFullYear()}
                                                        value={question.year}
                                                        onChange={(e) => updateQuestion(qIdx, 'year', e.target.value === '' ? '' : Number(e.target.value))}
                                                        placeholder="e.g. 2024"
                                                        className="border-border/60 font-body text-sm focus:border-canopy-500/40 focus:ring-canopy-500/20"
                                                    />
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label className="font-body text-sm font-semibold text-foreground">
                                                        Semester
                                                    </Label>
                                                    <Select
                                                        value={question.semester}
                                                        onValueChange={(value) => updateQuestion(qIdx, 'semester', value)}
                                                    >
                                                        <SelectTrigger className="border-border/60 bg-background/50 font-body text-sm shadow-none transition-all duration-200 hover:border-border hover:bg-background">
                                                            <SelectValue placeholder="Select semester" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {enum_options.semesters.map((s) => (
                                                                <SelectItem key={s.value} value={s.value} className="font-body text-sm">
                                                                    {s.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label htmlFor={`topic-${qIdx}`} className="font-body text-sm font-semibold text-foreground">
                                                    Related Topic
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id={`topic-${qIdx}`}
                                                        value={topicQuery}
                                                        onChange={(e) => setTopicQuery(e.target.value)}
                                                        placeholder="Search for a topic..."
                                                        className="border-border/60 font-body text-sm focus:border-canopy-500/40 focus:ring-canopy-500/20"
                                                    />
                                                    {topicResults.length > 0 && (
                                                        <div
                                                            className="absolute top-full z-20 mt-2 max-h-48 w-full overflow-auto rounded-lg border-2 border-border/40 bg-popover shadow-xl"
                                                            style={{ animation: 'fadeIn 0.2s ease-out' }}
                                                        >
                                                            {topicResults.map((topic) => (
                                                                <button
                                                                    key={topic.id}
                                                                    type="button"
                                                                    className="w-full px-4 py-2.5 text-left font-body text-sm transition-colors duration-150 hover:bg-canopy-100/50 dark:hover:bg-canopy-900/30"
                                                                    onClick={() => {
                                                                        updateQuestion(qIdx, 'topic_id', topic.id);
                                                                        setTopicQuery(topic.title);
                                                                        setTopicResults([]);
                                                                    }}
                                                                >
                                                                    {topic.title}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <InputError message={form.errors[`questions.${qIdx}.topic_id`]} />
                                            </div>

                                            {question.question_type === 'mcq' && (
                                                <div className="space-y-2.5">
                                                    <Label className="font-body text-sm font-semibold text-foreground">
                                                        Answer Options
                                                    </Label>
                                                    <McqOptionsBuilder
                                                        options={question.options}
                                                        onChange={(opts) => updateQuestion(qIdx, 'options', opts)}
                                                        errors={Object.fromEntries(
                                                            Object.entries(form.errors)
                                                                .filter(([key]) => key.startsWith(`questions.${qIdx}.options`))
                                                                .map(([key, val]) => [key.replace(`questions.${qIdx}.`, ''), val])
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}

                                <div className="flex items-center justify-between border-t border-border/40 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addQuestion}
                                        className="border-2 border-canopy-200/60 font-body font-semibold tracking-tight transition-all duration-200 hover:border-canopy-400/60 hover:bg-canopy-50/50 dark:border-canopy-800/40 dark:hover:border-canopy-700/60 dark:hover:bg-canopy-950/30"
                                    >
                                        <Plus className="size-4" strokeWidth={2.5} />
                                        Add Another Question
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={form.processing}
                                        className="border-2 border-canopy-600/20 bg-canopy-600 font-body font-semibold tracking-tight text-white shadow-md transition-all duration-200 hover:border-canopy-700/40 hover:bg-canopy-700 hover:shadow-lg dark:border-canopy-500/20 dark:bg-canopy-500"
                                    >
                                        {form.processing ? 'Saving...' : 'Save & Approve'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <style>{`
                    @keyframes fadeInDown {
                        from {
                            opacity: 0;
                            transform: translateY(-12px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    @keyframes fadeInLeft {
                        from {
                            opacity: 0;
                            transform: translateX(-16px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                    @keyframes fadeInRight {
                        from {
                            opacity: 0;
                            transform: translateX(16px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(12px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                `}</style>
            </AdminLayout>
        );
    }

    const isUploadTab = true;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Photo Uploads" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1.5">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Review Queue
                    </h1>
                    <p className="font-body text-sm text-muted-foreground">
                        Curate and approve community-contributed content
                    </p>
                </div>

                <nav className="relative border-b border-border" aria-label="Submission types">
                    <div className="flex gap-1">
                        <Link
                            href={ReviewQueueController.index.url()}
                            className={`
                                group relative px-5 py-3 font-body text-sm font-semibold tracking-tight transition-all duration-300
                                text-muted-foreground hover:text-foreground
                            `}
                        >
                            <span className="relative z-10">Content Submissions</span>
                        </Link>
                        <Link
                            href={ReviewQueueController.uploads.url()}
                            className={`
                                group relative px-5 py-3 font-body text-sm font-semibold tracking-tight transition-all duration-300
                                ${isUploadTab
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            <span className="relative z-10">Photo Uploads</span>
                            {isUploadTab && (
                                <span
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-canopy-600 via-canopy-500 to-canopy-600 dark:from-canopy-400 dark:via-canopy-300 dark:to-canopy-400"
                                    style={{
                                        animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                />
                            )}
                        </Link>
                    </div>
                </nav>

                <div className="rounded-lg border border-border bg-card shadow-sm">
                    <DataTable
                        columns={columns}
                        paginatedData={submissions}
                        getRowKey={(row) => row.id}
                        toolbar={
                            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <span className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Filter by
                                    </span>
                                </div>
                                <Select
                                    value={filters.status ?? 'all'}
                                    onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger className="w-[160px] border-border/60 bg-background/50 font-body text-sm font-medium shadow-none transition-all duration-200 hover:border-border hover:bg-background">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="font-body text-sm">
                                            All Statuses
                                        </SelectItem>
                                        {statuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value} className="font-body text-sm">
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="font-body text-xs font-semibold tracking-tight text-muted-foreground transition-all duration-200 hover:text-foreground"
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </div>
                        }
                        renderActions={(row) => (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 transition-all duration-200 hover:scale-110 hover:bg-canopy-100 hover:text-canopy-700 dark:hover:bg-canopy-900/30 dark:hover:text-canopy-400"
                                    asChild
                                >
                                    <Link href={ReviewQueueController.show.url(row.id)}>
                                        <Eye className="size-4" strokeWidth={2} />
                                        <span className="sr-only">View submission</span>
                                    </Link>
                                </Button>
                                {row.status === 'pending' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startTranscription(row)}
                                        className="font-body text-xs font-semibold tracking-tight transition-all duration-200 hover:bg-canopy-100 hover:text-canopy-700 dark:hover:bg-canopy-900/30 dark:hover:text-canopy-400"
                                    >
                                        Transcribe
                                    </Button>
                                )}
                            </div>
                        )}
                        emptyState={{
                            icon: ClipboardCheck,
                            title: 'All caught up',
                            description: 'No photo uploads to review right now. Check back later for new uploads.',
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: scaleX(0);
                        opacity: 0;
                    }
                    to {
                        transform: scaleX(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
