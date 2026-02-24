import { Head } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import EducationSystemController from '@/actions/App/Http/Controllers/Admin/EducationSystemController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { RowActions } from '@/components/admin/row-actions';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterHandlers, type BaseFilters } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import type { EducationSystem, PaginatedData } from '@/types/models';

interface EnumOption {
    value: string;
    label: string;
}

interface EducationSystemWithLabels extends EducationSystem {
    system_type_label: string;
}

interface Filters extends BaseFilters {
    system_type?: string;
}

interface Props {
    educationSystems: PaginatedData<EducationSystemWithLabels>;
    filters: Filters;
    systemTypes: EnumOption[];
}

const breadcrumbs = [{ title: 'Education Systems', href: '/admin/education-systems' }];

const columns: ColumnDef<EducationSystemWithLabels>[] = [
    {
        id: 'name',
        header: 'Name',
        cell: (row) => (
            <div>
                <span className="font-medium">{row.name}</span>
                {row.country && (
                    <span className="ml-2 text-xs text-muted-foreground">{row.country.code}</span>
                )}
            </div>
        ),
        sortable: true,
    },
    {
        id: 'system_type',
        header: 'Type',
        cell: (row) => row.system_type_label,
        sortable: true,
    },
    {
        id: 'curriculum_tiers_count',
        header: 'Tiers',
        cell: (row) => row.curriculum_tiers_count ?? 0,
        align: 'right',
        sortable: true,
    },
    {
        id: 'curriculum_subjects_count',
        header: 'Subjects',
        cell: (row) => row.curriculum_subjects_count ?? 0,
        align: 'right',
        sortable: true,
    },
    {
        id: 'streams_count',
        header: 'Streams',
        cell: (row) => row.streams_count ?? 0,
        align: 'right',
    },
    {
        id: 'assessment_types_count',
        header: 'Assessments',
        cell: (row) => row.assessment_types_count ?? 0,
        align: 'right',
    },
];

export default function AdminEducationSystems({ educationSystems, filters, systemTypes }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: EducationSystemController.index.url(),
        filters,
    });

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Education Systems" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Education Systems"
                    action={{ label: 'Add System', href: EducationSystemController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={educationSystems}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={EducationSystemController.index.url()}
                                placeholder="Search systems..."
                                queryParams={{
                                    system_type: filters.system_type,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.system_type ?? ''}
                                onValueChange={(value) => handleFilterChange('system_type', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {systemTypes.map((type) => (
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
                        <RowActions
                            editUrl={EducationSystemController.edit.url(row.id)}
                            actions={[{ label: 'View Details', href: EducationSystemController.show.url(row.id) }]}
                        />
                    )}
                    emptyState={{
                        icon: Globe,
                        title: 'No education systems found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
