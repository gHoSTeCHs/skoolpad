import { Head, Link, router } from '@inertiajs/react';
import { FileText, Hammer, MoreHorizontal, Trash2 } from 'lucide-react';
import QuestionPaperController from '@/actions/App/Http/Controllers/Admin/QuestionPaperController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { SearchInput } from '@/components/admin/search-input';
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
import type { BaseFilters } from '@/hooks/use-filter-handlers';
import type { PaginatedData } from '@/types/models';

interface PaperListItem {
    id: string;
    title: string;
    academic_session: string | null;
    semester: string | null;
    year: number | null;
    total_marks: number | null;
    duration_minutes: number | null;
    is_published: boolean;
    course_code: string | null;
    institution_abbreviation: string | null;
    assessment_type_name: string | null;
    sections_count: number;
    questions_count: number;
    created_at: string;
}

interface PaperFilters extends BaseFilters {
    institution_id?: string;
    assessment_type_id?: string;
    year?: string;
}

interface Props {
    papers: PaginatedData<PaperListItem>;
    institutions: { id: string; name: string; abbreviation: string }[];
    assessment_types: { id: string; name: string }[];
    filters: PaperFilters;
}

const breadcrumbs = [{ title: 'Question Papers', href: '/admin/question-papers' }];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => String(currentYear - i));

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatDuration(minutes: number | null): string {
    if (!minutes) {
        return '—';
    }
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

const columns: ColumnDef<PaperListItem>[] = [
    {
        id: 'title',
        header: 'Title',
        cell: (row) => <span className="line-clamp-2 max-w-[280px] font-medium">{row.title}</span>,
        sortable: true,
    },
    {
        id: 'source',
        header: 'Source',
        cell: (row) => {
            if (row.course_code) {
                return (
                    <div>
                        <span className="font-medium">{row.course_code}</span>
                        {row.institution_abbreviation && (
                            <span className="block text-xs text-muted-foreground">{row.institution_abbreviation}</span>
                        )}
                    </div>
                );
            }
            if (row.assessment_type_name) {
                return <span>{row.assessment_type_name}</span>;
            }
            return '—';
        },
    },
    {
        id: 'year',
        header: 'Year',
        cell: (row) => row.year ?? '—',
        sortable: true,
    },
    {
        id: 'sections_count',
        header: 'Sections',
        cell: (row) => row.sections_count,
        align: 'right',
    },
    {
        id: 'questions_count',
        header: 'Questions',
        cell: (row) => row.questions_count,
        align: 'right',
    },
    {
        id: 'total_marks',
        header: 'Total Marks',
        cell: (row) => row.total_marks ?? '—',
        align: 'right',
        sortable: true,
    },
    {
        id: 'duration_minutes',
        header: 'Duration',
        cell: (row) => formatDuration(row.duration_minutes),
    },
    {
        id: 'is_published',
        header: 'Status',
        cell: (row) =>
            row.is_published ? (
                <Badge variant="secondary" className="bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)]">
                    Published
                </Badge>
            ) : (
                <Badge variant="secondary" className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]">
                    Draft
                </Badge>
            ),
    },
    {
        id: 'created_at',
        header: 'Created',
        cell: (row) => formatDate(row.created_at),
        sortable: true,
    },
];

export default function AdminQuestionPapers({ papers, institutions, assessment_types, filters }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: QuestionPaperController.index.url(),
        filters,
    });

    function handleDelete(paper: PaperListItem) {
        if (confirm(`Delete paper "${paper.title}"?`)) {
            router.delete(QuestionPaperController.destroy.url(paper.id));
        }
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Question Papers" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Question Papers"
                    action={{ label: 'Create Paper', href: QuestionPaperController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={papers}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={QuestionPaperController.index.url()}
                                placeholder="Search papers..."
                                queryParams={{
                                    institution_id: filters.institution_id,
                                    assessment_type_id: filters.assessment_type_id,
                                    year: filters.year,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.institution_id ?? ''}
                                onValueChange={(value) => handleFilterChange('institution_id', value === 'all' ? undefined : value)}
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
                            <Select
                                value={filters.assessment_type_id ?? ''}
                                onValueChange={(value) => handleFilterChange('assessment_type_id', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Assessment Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Assessment Types</SelectItem>
                                    {assessment_types.map((at) => (
                                        <SelectItem key={at.id} value={at.id}>
                                            {at.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    <Link href={QuestionPaperController.build.url(row.id)}>
                                        <Hammer className="size-4" />
                                        Build
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleDelete(row)}
                                >
                                    <Trash2 className="size-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    emptyState={{
                        icon: FileText,
                        title: 'No question papers found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
