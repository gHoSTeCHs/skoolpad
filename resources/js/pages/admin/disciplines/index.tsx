import { Head } from '@inertiajs/react';
import { Shapes } from 'lucide-react';
import DisciplineController from '@/actions/App/Http/Controllers/Admin/DisciplineController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import AdminLayout from '@/layouts/admin-layout';
import type { Discipline, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    sort?: string;
    direction?: string;
}

interface Props {
    disciplines: PaginatedData<Discipline>;
    filters: Filters;
}

const breadcrumbs = [{ title: 'Disciplines', href: '/admin/disciplines' }];

const columns: ColumnDef<Discipline>[] = [
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
        id: 'description',
        header: 'Description',
        cell: (row) => <span className="line-clamp-1">{row.description || '—'}</span>,
        className: 'max-w-[300px]',
    },
    {
        id: 'canonical_topics_count',
        header: 'Topics',
        cell: (row) => row.canonical_topics_count ?? 0,
        align: 'right',
        sortable: true,
    },
];

export default function AdminDisciplines({ disciplines, filters }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Disciplines" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Disciplines"
                    action={{ label: 'Add Discipline', href: DisciplineController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={disciplines}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={DisciplineController.index.url()}
                                placeholder="Search disciplines..."
                                queryParams={{ sort: filters.sort, direction: filters.direction }}
                            />
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={DisciplineController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: Shapes,
                        title: 'No disciplines found',
                        description: 'Try adjusting your search criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
