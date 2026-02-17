import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Pencil } from 'lucide-react';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { SearchInput } from '@/components/admin/search-input';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { ExamType, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    is_active?: string;
}

interface Props {
    examTypes: PaginatedData<ExamType>;
    filters: Filters;
}

const breadcrumbs = [{ title: 'Exam Types', href: '/admin/exam-types' }];

export default function AdminExamTypes({ examTypes, filters }: Props) {
    const indexUrl = ExamTypeController.index.url();

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
            <Head title="Exam Types" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Exam Types"
                    action={{ label: 'Add Exam Type', href: ExamTypeController.create.url() }}
                />

                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        value={filters.search ?? ''}
                        routeUrl={indexUrl}
                        placeholder="Search exam types..."
                        queryParams={{ is_active: filters.is_active }}
                    />
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
                    {filters.is_active && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </div>

                <Card className="p-0">
                    {examTypes.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="text-right">Duration (mins)</TableHead>
                                    <TableHead className="text-right">Questions/Subject</TableHead>
                                    <TableHead className="text-right">Subjects</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {examTypes.data.map((examType) => (
                                    <TableRow key={examType.id}>
                                        <TableCell className="font-medium">{examType.name}</TableCell>
                                        <TableCell>
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                                {examType.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">{examType.duration_minutes ?? '—'}</TableCell>
                                        <TableCell className="text-right">{examType.questions_per_subject ?? '—'}</TableCell>
                                        <TableCell className="text-right">{examType.exam_subjects_count ?? 0}</TableCell>
                                        <TableCell>
                                            <StatusBadge isActive={examType.is_active} />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={ExamTypeController.edit.url(examType.id)}>
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
                            <ClipboardList className="size-10 text-muted-foreground/50" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">No exam types found</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </Card>

                <Pagination meta={examTypes.meta} links={examTypes.links} />
            </div>
        </AdminLayout>
    );
}
