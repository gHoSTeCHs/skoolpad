import { Head } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import type { ExamSubject, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    sort?: string;
    direction?: string;
}

interface Props {
    examSubjects: PaginatedData<ExamSubject>;
    filters: Filters;
    examType: { id: string; name: string; slug: string };
}

const columns: ColumnDef<ExamSubject>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => <span className="font-medium">{row.name}</span>,
        sortable: true,
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
        id: 'is_compulsory',
        header: 'Compulsory',
        cell: (row) => (
            <Badge variant={row.is_compulsory ? 'default' : 'secondary'}>
                {row.is_compulsory ? 'Yes' : 'No'}
            </Badge>
        ),
        sortable: true,
    },
];

export default function AdminExamSubjects({ examSubjects, filters, examType }: Props) {
    const indexUrl = ExamSubjectController.index.url(examType.id);

    const breadcrumbs = [
        { title: 'Exam Types', href: ExamTypeController.index.url() },
        { title: examType.name, href: indexUrl },
        { title: 'Subjects', href: indexUrl },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${examType.name} Subjects`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title={`${examType.name} Subjects`}
                    action={{
                        label: 'Add Subject',
                        href: ExamSubjectController.create.url(examType.id),
                    }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={examSubjects}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <SearchInput
                            value={filters.search ?? ''}
                            routeUrl={indexUrl}
                            placeholder="Search subjects..."
                            queryParams={{ sort: filters.sort, direction: filters.direction }}
                        />
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={ExamSubjectController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: FileText,
                        title: 'No subjects found',
                        description: 'Try adjusting your search criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
