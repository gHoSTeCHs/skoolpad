import { Head } from '@inertiajs/react';
import { Ruler } from 'lucide-react';
import GradingScaleController from '@/actions/App/Http/Controllers/Admin/GradingScaleController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterHandlers, type BaseFilters } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import type { GradingScale, PaginatedData } from '@/types/models';

interface GradingScaleWithLabels extends GradingScale {
    scale_type_label: string;
    assessment_types_count: number;
}

interface Filters extends BaseFilters {
    scale_type?: string;
}

interface Props {
    gradingScales: PaginatedData<GradingScaleWithLabels>;
    filters: Filters;
    scaleTypes: { value: string; label: string }[];
}

const breadcrumbs = [{ title: 'Grading Scales', href: '/admin/grading-scales' }];

const columns: ColumnDef<GradingScaleWithLabels>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => <span className="font-medium">{row.name}</span>,
        sortable: true,
    },
    {
        id: 'scale_type',
        header: 'Type',
        cell: (row) => row.scale_type_label,
        sortable: true,
    },
    {
        id: 'scale_min',
        header: 'Min',
        cell: (row) => row.scale_min ?? '\u2014',
        align: 'right',
    },
    {
        id: 'scale_max',
        header: 'Max',
        cell: (row) => row.scale_max ?? '\u2014',
        align: 'right',
    },
    {
        id: 'pass_threshold',
        header: 'Pass',
        cell: (row) => row.pass_threshold ?? '\u2014',
        align: 'right',
    },
    {
        id: 'assessment_types_count',
        header: 'Assessments',
        cell: (row) => row.assessment_types_count ?? 0,
        align: 'right',
        sortable: true,
    },
];

export default function AdminGradingScales({ gradingScales, filters, scaleTypes }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: GradingScaleController.index.url(),
        filters,
    });

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Grading Scales" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Grading Scales"
                    action={{ label: 'Add Scale', href: GradingScaleController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={gradingScales}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={GradingScaleController.index.url()}
                                placeholder="Search scales..."
                                queryParams={{
                                    scale_type: filters.scale_type,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.scale_type ?? ''}
                                onValueChange={(value) => handleFilterChange('scale_type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {scaleTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
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
                        <RowActions editUrl={GradingScaleController.edit.url(row.id)} />
                    )}
                    emptyState={{
                        icon: Ruler,
                        title: 'No grading scales found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
