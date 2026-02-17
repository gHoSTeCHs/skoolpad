import { Head, router } from '@inertiajs/react';
import { BookMarked } from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import type { Department, PaginatedData } from '@/types/models';

interface FacultyWithInstitution {
    id: string;
    name: string;
    institution_id: string;
    institution?: { id: string; name: string };
}

interface Filters {
    search?: string;
    faculty_id?: string;
}

interface Props {
    departments: PaginatedData<Department>;
    filters: Filters;
    faculties: FacultyWithInstitution[];
}

const breadcrumbs = [{ title: 'Departments', href: '/admin/departments' }];

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
    },
    {
        id: 'faculty',
        header: 'Faculty',
        cell: (row) => row.faculty?.name ?? '—',
    },
    {
        id: 'institution',
        header: 'Institution',
        cell: (row) => row.faculty?.institution?.name ?? '—',
    },
];

export default function AdminDepartments({ departments, filters, faculties }: Props) {
    const indexUrl = DepartmentController.index.url();

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
            <Head title="Departments" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Departments"
                    action={{ label: 'Add Department', href: DepartmentController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={departments}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={indexUrl}
                                placeholder="Search departments..."
                                queryParams={{ faculty_id: filters.faculty_id }}
                            />
                            <Select
                                value={filters.faculty_id ?? ''}
                                onValueChange={(value) => handleFilterChange('faculty_id', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[260px]">
                                    <SelectValue placeholder="All Faculties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Faculties</SelectItem>
                                    {faculties.map((faculty) => (
                                        <SelectItem key={faculty.id} value={faculty.id}>
                                            {faculty.name}{faculty.institution ? ` — ${faculty.institution.name}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {filters.faculty_id && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={DepartmentController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: BookMarked,
                        title: 'No departments found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
