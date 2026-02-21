import { Head } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterHandlers, type BaseFilters } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import { institutionTypeLabels, ownershipTypeLabels } from '@/lib/enum-labels';
import type { Institution, PaginatedData } from '@/types/models';

interface EnumCase {
    value: string;
}

interface Filters extends BaseFilters {
    institution_type?: string;
    ownership_type?: string;
    is_active?: string;
}

interface Props {
    institutions: PaginatedData<Institution>;
    filters: Filters;
    institutionTypes: EnumCase[];
    ownershipTypes: EnumCase[];
}

const breadcrumbs = [{ title: 'Institutions', href: '/admin/institutions' }];

const columns: ColumnDef<Institution>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => (
            <div>
                <span className="font-medium">{row.name}</span>
                <span className="ml-2 text-muted-foreground">{row.abbreviation}</span>
            </div>
        ),
        sortable: true,
    },
    {
        id: 'institution_type',
        header: 'Type',
        cell: (row) => institutionTypeLabels[row.institution_type] ?? row.institution_type,
        sortable: true,
    },
    {
        id: 'ownership_type',
        header: 'Ownership',
        cell: (row) => ownershipTypeLabels[row.ownership_type] ?? row.ownership_type,
        sortable: true,
    },
    {
        id: 'state',
        header: 'Location',
        cell: (row) => [row.city, row.state].filter(Boolean).join(', ') || '—',
        sortable: true,
    },
    {
        id: 'faculties_count',
        header: 'Faculties',
        cell: (row) => row.faculties_count ?? 0,
        align: 'right',
        sortable: true,
    },
    {
        id: 'is_active',
        header: 'Status',
        cell: (row) => <StatusBadge isActive={row.is_active} />,
        sortable: true,
    },
];

export default function AdminInstitutions({ institutions, filters, institutionTypes, ownershipTypes }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: InstitutionController.index.url(),
        filters,
    });

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Institutions" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Institutions"
                    action={{ label: 'Add Institution', href: InstitutionController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={institutions}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={InstitutionController.index.url()}
                                placeholder="Search institutions..."
                                queryParams={{
                                    institution_type: filters.institution_type,
                                    ownership_type: filters.ownership_type,
                                    is_active: filters.is_active,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.institution_type ?? ''}
                                onValueChange={(value) => handleFilterChange('institution_type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {institutionTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {institutionTypeLabels[type.value] ?? type.value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.ownership_type ?? ''}
                                onValueChange={(value) => handleFilterChange('ownership_type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Ownership" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Ownership</SelectItem>
                                    {ownershipTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {ownershipTypeLabels[type.value] ?? type.value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions
                            editUrl={InstitutionController.edit.url(row.id)}
                            actions={[{ label: 'View Faculties', href: FacultyController.index.url(row.id) }]}
                        />
                    )}
                    emptyState={{
                        icon: Building2,
                        title: 'No institutions found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
