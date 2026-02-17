import { Head, Link, router } from '@inertiajs/react';
import { Building2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { SearchInput } from '@/components/admin/search-input';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { institutionTypeLabels, ownershipTypeLabels } from '@/lib/enum-labels';
import type { Institution, PaginatedData } from '@/types/models';

interface EnumCase {
    value: string;
}

interface Filters {
    search?: string;
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

function hasActiveFilters(filters: Filters): boolean {
    return !!(filters.institution_type || filters.ownership_type || filters.is_active);
}

export default function AdminInstitutions({ institutions, filters, institutionTypes, ownershipTypes }: Props) {
    function handleFilterChange(key: string, value: string | undefined) {
        router.get(
            route('admin.institutions.index'),
            { ...filters, [key]: value || undefined, search: filters.search || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function clearFilters() {
        router.get(
            route('admin.institutions.index'),
            { search: filters.search || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Institutions" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Institutions"
                    action={{ label: 'Add Institution', href: route('admin.institutions.create') }}
                />

                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        value={filters.search ?? ''}
                        routeName="admin.institutions.index"
                        placeholder="Search institutions..."
                        queryParams={{
                            institution_type: filters.institution_type,
                            ownership_type: filters.ownership_type,
                            is_active: filters.is_active,
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
                    {hasActiveFilters(filters) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </div>

                <Card className="p-0">
                    {institutions.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Ownership</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Faculties</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {institutions.data.map((institution) => (
                                    <TableRow key={institution.id}>
                                        <TableCell>
                                            <div>
                                                <span className="font-medium">{institution.name}</span>
                                                <span className="ml-2 text-muted-foreground">{institution.abbreviation}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{institutionTypeLabels[institution.institution_type] ?? institution.institution_type}</TableCell>
                                        <TableCell>{ownershipTypeLabels[institution.ownership_type] ?? institution.ownership_type}</TableCell>
                                        <TableCell>
                                            {[institution.city, institution.state].filter(Boolean).join(', ') || '—'}
                                        </TableCell>
                                        <TableCell className="text-right">{institution.faculties_count ?? 0}</TableCell>
                                        <TableCell>
                                            <StatusBadge isActive={institution.is_active} />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.institutions.edit', institution.id)}>
                                                    <Pencil className="size-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Building2 className="size-10 text-muted-foreground/50" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">No institutions found</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </Card>

                <Pagination meta={institutions.meta} links={institutions.links} />
            </div>
        </AdminLayout>
    );
}
