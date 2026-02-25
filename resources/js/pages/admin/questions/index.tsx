import { Head, Link, router } from '@inertiajs/react';
import { FileText, HelpCircle, MessageSquare, MoreHorizontal, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import AnswerController from '@/actions/App/Http/Controllers/Admin/AnswerController';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { SearchInput } from '@/components/admin/search-input';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterHandlers } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import type { PaginatedData } from '@/types/models';
import type {
    CourseOption,
    EnumOption,
    InstitutionOption,
    QuestionEnumOptions,
    QuestionFilters,
    QuestionListItem,
    QuestionStatus,
} from '@/types/questions';

interface Props {
    questions: PaginatedData<QuestionListItem>;
    institutions: InstitutionOption[];
    filters: QuestionFilters;
    enum_options: QuestionEnumOptions & { statuses: EnumOption<QuestionStatus>[] };
}

const breadcrumbs = [{ title: 'Questions', href: '/admin/questions' }];

const statusStyles: Record<string, string> = {
    draft: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]',
    in_review: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)] hover:bg-[var(--badge-reward-bg)]',
    published: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)]',
    archived: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)] hover:bg-[var(--badge-danger-bg)]',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    published: 'Published',
    archived: 'Archived',
};

const difficultyStyles: Record<string, string> = {
    easy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    medium: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    hard: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

const difficultyLabels: Record<string, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
};

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => String(currentYear - i));

const columns: ColumnDef<QuestionListItem>[] = [
    {
        id: 'content',
        header: 'Content',
        cell: (row) => <span className="line-clamp-2 max-w-[300px]">{row.content}</span>,
    },
    {
        id: 'course',
        header: 'Course',
        cell: (row) => (
            <div>
                <span className="font-medium">{row.course_code ?? '—'}</span>
                {row.institution_abbreviation && (
                    <span className="block text-xs text-muted-foreground">{row.institution_abbreviation}</span>
                )}
            </div>
        ),
    },
    {
        id: 'year',
        header: 'Year',
        cell: (row) => row.year ?? '—',
        sortable: true,
    },
    {
        id: 'question_type',
        header: 'Type',
        cell: (row) => <QuestionTypeBadge type={row.question_type} />,
        sortable: true,
    },
    {
        id: 'status',
        header: 'Status',
        cell: (row) => (
            <Badge variant="secondary" className={statusStyles[row.status] ?? ''}>
                {statusLabels[row.status] ?? row.status}
            </Badge>
        ),
        sortable: true,
    },
    {
        id: 'difficulty_level',
        header: 'Difficulty',
        cell: (row) =>
            row.difficulty_level ? (
                <Badge variant="secondary" className={difficultyStyles[row.difficulty_level] ?? ''}>
                    {difficultyLabels[row.difficulty_level] ?? row.difficulty_level}
                </Badge>
            ) : (
                '—'
            ),
    },
    {
        id: 'topic_links_count',
        header: 'Topics',
        cell: (row) => row.topic_links_count,
        align: 'right',
    },
    {
        id: 'answers_count',
        header: 'Answers',
        cell: (row) => row.answers_count,
        align: 'right',
    },
    {
        id: 'created_at',
        header: 'Created',
        cell: (row) => formatDate(row.created_at),
        sortable: true,
    },
];

export default function AdminQuestions({ questions, institutions, filters, enum_options }: Props) {
    const { handleFilterChange, clearFilters: baseClearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: QuestionController.index.url(),
        filters,
    });
    const [courses, setCourses] = useState<CourseOption[]>([]);

    useEffect(() => {
        if (filters.institution_id) {
            fetch(`/admin/api/institutions/${filters.institution_id}/courses`)
                .then((res) => res.json())
                .then((data: CourseOption[]) => setCourses(data))
                .catch(() => setCourses([]));
        }
    }, []);

    function handleInstitutionChange(value: string) {
        if (value === 'all') {
            setCourses([]);
            const { institution_id, institution_course_id, ...rest } = filters;
            router.get(QuestionController.index.url(), { ...rest, search: filters.search || undefined }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
            return;
        }

        fetch(`/admin/api/institutions/${value}/courses`)
            .then((res) => res.json())
            .then((data: CourseOption[]) => setCourses(data))
            .catch(() => setCourses([]));

        const { institution_course_id, ...rest } = filters;
        router.get(QuestionController.index.url(), { ...rest, institution_id: value, search: filters.search || undefined }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    function clearFilters() {
        setCourses([]);
        baseClearFilters();
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Questions" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-bold tracking-tight">Questions</h1>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" asChild>
                            <Link href={QuestionPaperController.index.url()}>
                                <FileText className="size-4" />
                                Question Papers
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={QuestionController.create.url()}>Create Question</Link>
                        </Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    paginatedData={questions}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={QuestionController.index.url()}
                                placeholder="Search questions..."
                                queryParams={{
                                    institution_id: filters.institution_id,
                                    institution_course_id: filters.institution_course_id,
                                    year: filters.year,
                                    semester: filters.semester,
                                    question_type: filters.question_type,
                                    status: filters.status,
                                    difficulty_level: filters.difficulty_level,
                                    source: filters.source,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.institution_id ?? ''}
                                onValueChange={handleInstitutionChange}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Institutions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Institutions</SelectItem>
                                    {institutions.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.abbreviation}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {courses.length > 0 && (
                                <Select
                                    value={filters.institution_course_id ?? ''}
                                    onValueChange={(value) => handleFilterChange('institution_course_id', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Courses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Courses</SelectItem>
                                        {courses.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.course_code}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Select
                                value={filters.year ?? ''}
                                onValueChange={(value) => handleFilterChange('year', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="All Years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.semester ?? ''}
                                onValueChange={(value) => handleFilterChange('semester', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All Semesters" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Semesters</SelectItem>
                                    {enum_options.semesters.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.question_type ?? ''}
                                onValueChange={(value) => handleFilterChange('question_type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {enum_options.question_types.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.status ?? ''}
                                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {enum_options.statuses.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.difficulty_level ?? ''}
                                onValueChange={(value) => handleFilterChange('difficulty_level', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Difficulties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Difficulties</SelectItem>
                                    {enum_options.difficulties.map((d) => (
                                        <SelectItem key={d.value} value={d.value}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.source ?? ''}
                                onValueChange={(value) => handleFilterChange('source', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Sources" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    {enum_options.sources.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={QuestionController.edit.url(row.id)}>
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={AnswerController.index.url(row.id)}>
                                        <MessageSquare className="size-4" />
                                        Manage Answers
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    emptyState={{
                        icon: HelpCircle,
                        title: 'No questions found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
