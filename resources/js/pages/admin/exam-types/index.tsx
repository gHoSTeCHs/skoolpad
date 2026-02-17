import { Head, router } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import type { ExamType, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    is_active?: string;
}

interface Props {
    examTypes: PaginatedData<ExamType>;
    filters: Filters;
}

const breadcrumbs = [{ title: 'Exam Types', href: '/admin/exam-types' }];

const columns: ColumnDef<ExamType>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
        id: 'slug',
        header: 'Slug',
        cell: (row) => (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {row.slug}
            </code>
        ),
    },
    {
        id: 'duration',
        header: 'Duration (mins)',
        cell: (row) => row.duration_minutes ?? '—',
        align: 'right',
    },
    {
        id: 'questions',
        header: 'Questions/Subject',
        cell: (row) => row.questions_per_subject ?? '—',
        align: 'right',
    },
    {
        id: 'subjects',
        header: 'Subjects',
        cell: (row) => row.exam_subjects_count ?? 0,
        align: 'right',
    },
    {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge isActive={row.is_active} />,
    },
];

export default function AdminExamTypes({ examTypes, filters }: Props) {
    const indexUrl = ExamTypeController.index.url();

    function handleFilterChange(key: string, value: string | undefined) {
        router.get(
            indexUrl,
            { ...filters, [key]: value || undefined, search: filters.search || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function clearFilters() {
        router.get(
            indexUrl,
            { search: filters.search || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Types" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Exam Types"
                    action={{ label: 'Add Exam Type', href: ExamTypeController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={examTypes}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={indexUrl}
                                placeholder="Search exam types..."
                                queryParams={{ is_active: filters.is_active }}
                            />
                            <Select
                                value={filters.is_active ?? ''}
                                onValueChange={(value) => handleFilterChange('is_active', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            {filters.is_active && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={ExamTypeController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: ClipboardList,
                        title: 'No exam types found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
