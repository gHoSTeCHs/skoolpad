import { Head, Link, router } from '@inertiajs/react';
import { Library, Pencil } from 'lucide-react';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export default function AdminFaculties({ faculties, filters, institutions }: Props) {
    const indexUrl = FacultyController.index.url();

    console.log(faculties)

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

                <Card className="p-0">
                    {faculties.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Institution</TableHead>
                                    <TableHead className="text-right">Departments</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {faculties.data.map((faculty) => (
                                    <TableRow key={faculty.id}>
                                        <TableCell>
                                            <div>
                                                <span className="font-medium">{faculty.name}</span>
                                                {faculty.abbreviation && (
                                                    <span className="ml-2 text-muted-foreground">{faculty.abbreviation}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{faculty.institution?.name ?? '—'}</TableCell>
                                        <TableCell className="text-right">{faculty.departments_count ?? 0}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={FacultyController.edit.url(faculty.id)}>
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
                            <Library className="size-10 text-muted-foreground/50" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">No faculties found</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </Card>

                <Pagination meta={faculties.meta} links={faculties.links} />
            </div>
        </AdminLayout>
    );
}
