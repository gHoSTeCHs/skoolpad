import { Head } from '@inertiajs/react';
import { Library } from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import AdminLayout from '@/layouts/admin-layout';
import type { Faculty, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    sort?: string;
    direction?: string;
}

interface Props {
    faculties: PaginatedData<Faculty>;
    filters: Filters;
    institution: { id: string; name: string; abbreviation: string };
}

const columns: ColumnDef<Faculty>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => (
            <div>
                <span className="font-medium">{row.name}</span>
                {row.abbreviation && (
                    <span className="ml-2 text-muted-foreground">{row.abbreviation}</span>
                )}
            </div>
        ),
        sortable: true,
    },
    {
        id: 'departments_count',
        header: 'Departments',
        cell: (row) => row.departments_count ?? 0,
        align: 'right',
        sortable: true,
    },
];

export default function AdminFaculties({ faculties, filters, institution }: Props) {
    const indexUrl = FacultyController.index.url(institution.id);

    const breadcrumbs = [
        { title: 'Institutions', href: InstitutionController.index.url() },
        { title: institution.name, href: indexUrl },
        { title: 'Faculties', href: indexUrl },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${institution.abbreviation} Faculties`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title={`${institution.abbreviation} Faculties`}
                    action={{ label: 'Add Faculty', href: FacultyController.create.url(institution.id) }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={faculties}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <SearchInput
                            value={filters.search ?? ''}
                            routeUrl={indexUrl}
                            placeholder="Search faculties..."
                            queryParams={{ sort: filters.sort, direction: filters.direction }}
                        />
                    }
                    renderActions={(row) => (
                        <RowActions
                            editUrl={FacultyController.edit.url(row.id)}
                            actions={[{ label: 'View Departments', href: DepartmentController.index.url(row.id) }]}
                        />
                    )}
                    emptyState={{
                        icon: Library,
                        title: 'No faculties found',
                        description: 'Try adjusting your search criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
