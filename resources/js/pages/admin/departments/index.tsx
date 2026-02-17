import { Head, Link, router } from '@inertiajs/react';
import { BookMarked, Pencil } from 'lucide-react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

                <Card className="p-0">
                    {departments.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Faculty</TableHead>
                                    <TableHead>Institution</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.data.map((department) => (
                                    <TableRow key={department.id}>
                                        <TableCell>
                                            <div>
                                                <span className="font-medium">{department.name}</span>
                                                {department.abbreviation && (
                                                    <span className="ml-2 text-muted-foreground">{department.abbreviation}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{department.faculty?.name ?? '—'}</TableCell>
                                        <TableCell>{department.faculty?.institution?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={DepartmentController.edit.url(department.id)}>
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
                            <BookMarked className="size-10 text-muted-foreground/50" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">No departments found</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </Card>

                <Pagination meta={departments.meta} links={departments.links} />
            </div>
        </AdminLayout>
    );
}
