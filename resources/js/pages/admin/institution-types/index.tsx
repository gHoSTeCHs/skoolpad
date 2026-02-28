import { Head } from '@inertiajs/react';
import { Landmark } from 'lucide-react';
import InstitutionTypeController from '@/actions/App/Http/Controllers/Admin/InstitutionTypeController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { Badge } from '@/components/ui/badge';
import { useFilterHandlers, type BaseFilters } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import type { InstitutionTypeModel, PaginatedData } from '@/types/models';

interface Props {
    institutionTypes: PaginatedData<InstitutionTypeModel>;
    filters: BaseFilters;
}

const breadcrumbs = [{ title: 'Institution Types', href: '/admin/institution-types' }];

const columns: ColumnDef<InstitutionTypeModel>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => <span className="font-medium">{row.name}</span>,
        sortable: true,
    },
    {
        id: 'country',
        header: 'Country',
        cell: (row) => row.country?.name ?? '\u2014',
    },
    {
        id: 'level_progression',
        header: 'Levels',
        cell: (row) => (
            <div className="flex flex-wrap gap-1">
                {row.level_progression?.map((level) => (
                    <Badge key={level} variant="secondary" className="text-xs">
                        {level}
                    </Badge>
                ))}
            </div>
        ),
    },
    {
        id: 'credit_system',
        header: 'Credit System',
        cell: (row) => row.credit_system ?? '\u2014',
        sortable: true,
    },
    {
        id: 'grading_scale',
        header: 'Grading Scale',
        cell: (row) => row.grading_scale?.name ?? '\u2014',
    },
];

export default function AdminInstitutionTypes({ institutionTypes, filters }: Props) {
    const { clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: InstitutionTypeController.index.url(),
        filters,
    });

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Institution Types" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Institution Types"
                    action={{ label: 'Add Type', href: InstitutionTypeController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={institutionTypes}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={InstitutionTypeController.index.url()}
                                placeholder="Search types..."
                                queryParams={{
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            {hasActiveFilters && (
                                <button className="text-sm text-muted-foreground hover:underline" onClick={clearFilters}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <RowActions editUrl={InstitutionTypeController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: Landmark,
                        title: 'No institution types found',
                        description: 'Try adjusting your search criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
