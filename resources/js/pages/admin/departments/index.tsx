import { Head } from '@inertiajs/react';
import { BookMarked } from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import AdminLayout from '@/layouts/admin-layout';
import type { Department, PaginatedData } from '@/types/models';

interface FacultyWithInstitution {
    id: string;
    name: string;
    abbreviation: string | null;
    institution: { id: string; name: string; abbreviation: string } | null;
}

interface Filters {
    search?: string;
    sort?: string;
    direction?: string;
}

interface Props {
    departments: PaginatedData<Department>;
    filters: Filters;
    faculty: FacultyWithInstitution;
}

const columns: ColumnDef<Department>[] = [
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
];

export default function AdminDepartments({ departments, filters, faculty }: Props) {
    const indexUrl = DepartmentController.index.url(faculty.id);
    const institution = faculty.institution!;

    const breadcrumbs = [
        { title: 'Institutions', href: InstitutionController.index.url() },
        { title: institution.name, href: FacultyController.index.url(institution.id) },
        { title: faculty.name, href: indexUrl },
        { title: 'Departments', href: indexUrl },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${faculty.name} Departments`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title={`${faculty.abbreviation ?? faculty.name} Departments`}
                    action={{ label: 'Add Department', href: DepartmentController.create.url(faculty.id) }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={departments}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <SearchInput
                            value={filters.search ?? ''}
                            routeUrl={indexUrl}
                            placeholder="Search departments..."
                            queryParams={{ sort: filters.sort, direction: filters.direction }}
                        />
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={DepartmentController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: BookMarked,
                        title: 'No departments found',
                        description: 'Try adjusting your search criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
