import { Head, router } from '@inertiajs/react';
import { Library } from 'lucide-react';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import type { Faculty, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    institution_id?: string;
}

interface Props {
    faculties: PaginatedData<Faculty>;
    filters: Filters;
    institutions: { id: string; name: string }[];
}

const breadcrumbs = [{ title: 'Faculties', href: '/admin/faculties' }];

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
    },
    {
        id: 'institution',
        header: 'Institution',
        cell: (row) => row.institution?.name ?? '—',
    },
    {
        id: 'departments',
        header: 'Departments',
        cell: (row) => row.departments_count ?? 0,
        align: 'right',
    },
];

export default function AdminFaculties({ faculties, filters, institutions }: Props) {
    const indexUrl = FacultyController.index.url();

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
            <Head title="Faculties" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Faculties"
                    action={{ label: 'Add Faculty', href: FacultyController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={faculties}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={indexUrl}
                                placeholder="Search faculties..."
                                queryParams={{ institution_id: filters.institution_id }}
                            />
                            <Select
                                value={filters.institution_id ?? ''}
                                onValueChange={(value) => handleFilterChange('institution_id', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="All Institutions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Institutions</SelectItem>
                                    {institutions.map((institution) => (
                                        <SelectItem key={institution.id} value={institution.id}>
                                            {institution.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {filters.institution_id && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={FacultyController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: Library,
                        title: 'No faculties found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
