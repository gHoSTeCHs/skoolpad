import { Head, Link, router } from '@inertiajs/react';
import { FileText, Pencil } from 'lucide-react';
import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { SearchInput } from '@/components/admin/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { ExamSubject, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
    exam_type_id?: string;
}

interface Props {
    examSubjects: PaginatedData<ExamSubject>;
    filters: Filters;
    examTypes: { id: string; name: string }[];
}

const breadcrumbs = [{ title: 'Exam Subjects', href: '/admin/exam-subjects' }];

export default function AdminExamSubjects({ examSubjects, filters, examTypes }: Props) {
    const indexUrl = ExamSubjectController.index.url();

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
            <Head title="Exam Subjects" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Exam Subjects"
                    action={{ label: 'Add Exam Subject', href: ExamSubjectController.create.url() }}
                />

                <div className="flex flex-wrap items-center gap-3">
                    <SearchInput
                        value={filters.search ?? ''}
                        routeUrl={indexUrl}
                        placeholder="Search exam subjects..."
                        queryParams={{ exam_type_id: filters.exam_type_id }}
                    />
                    <Select
                        value={filters.exam_type_id ?? ''}
                        onValueChange={(value) => handleFilterChange('exam_type_id', value === 'all' ? undefined : value)}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Exam Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Exam Types</SelectItem>
                            {examTypes.map((examType) => (
                                <SelectItem key={examType.id} value={examType.id}>
                                    {examType.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {filters.exam_type_id && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </div>

                <Card className="p-0">
                    {examSubjects.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Exam Type</TableHead>
                                    <TableHead>Compulsory</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {examSubjects.data.map((examSubject) => (
                                    <TableRow key={examSubject.id}>
                                        <TableCell className="font-medium">{examSubject.name}</TableCell>
                                        <TableCell>
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                                {examSubject.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>{examSubject.exam_type?.name ?? '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={examSubject.is_compulsory ? 'default' : 'secondary'}>
                                                {examSubject.is_compulsory ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={ExamSubjectController.edit.url(examSubject.id)}>
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
                            <FileText className="size-10 text-muted-foreground/50" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">No exam subjects found</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </Card>

                <Pagination meta={examSubjects.meta} links={examSubjects.links} />
            </div>
        </AdminLayout>
    );
}
