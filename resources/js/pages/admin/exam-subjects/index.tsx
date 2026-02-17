import { Head, router } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import type { ExamSubject, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    exam_type_id?: string;
}

interface Props {
    examSubjects: PaginatedData<ExamSubject>;
    filters: Filters;
    examTypes: { id: string; name: string }[];
}

const breadcrumbs = [{ title: 'Exam Subjects', href: '/admin/exam-subjects' }];

const columns: ColumnDef<ExamSubject>[] = [
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
        id: 'exam_type',
        header: 'Exam Type',
        cell: (row) => row.exam_type?.name ?? '—',
    },
    {
        id: 'compulsory',
        header: 'Compulsory',
        cell: (row) => (
            <Badge variant={row.is_compulsory ? 'default' : 'secondary'}>
                {row.is_compulsory ? 'Yes' : 'No'}
            </Badge>
        ),
    },
];

export default function AdminExamSubjects({ examSubjects, filters, examTypes }: Props) {
    const indexUrl = ExamSubjectController.index.url();

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
            <Head title="Exam Subjects" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Exam Subjects"
                    action={{ label: 'Add Exam Subject', href: ExamSubjectController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={examSubjects}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={indexUrl}
                                placeholder="Search exam subjects..."
                                queryParams={{ exam_type_id: filters.exam_type_id }}
                            />
                            <Select
                                value={filters.exam_type_id ?? ''}
                                onValueChange={(value) => handleFilterChange('exam_type_id', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Exam Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Exam Types</SelectItem>
                                    {examTypes.map((examType) => (
                                        <SelectItem key={examType.id} value={examType.id}>
                                            {examType.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {filters.exam_type_id && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={ExamSubjectController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: FileText,
                        title: 'No exam subjects found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
