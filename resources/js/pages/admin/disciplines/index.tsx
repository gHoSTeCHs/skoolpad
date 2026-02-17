import { Head, Link } from '@inertiajs/react';
import { Pencil, Shapes } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Pagination } from '@/components/admin/pagination';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { Discipline, PaginatedData } from '@/types/models';

interface Filters {
    search?: string;
}

interface Props {
    disciplines: PaginatedData<Discipline>;
    filters: Filters;
}

const breadcrumbs = [{ title: 'Disciplines', href: '/admin/disciplines' }];

export default function AdminDisciplines({ disciplines, filters }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Disciplines" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Disciplines"
                    action={{ label: 'Add Discipline', href: route('admin.disciplines.create') }}
                />

                <div className="flex items-center gap-3">
                    <SearchInput
                        value={filters.search ?? ''}
                        routeName="admin.disciplines.index"
                        placeholder="Search disciplines..."
                    />
                </div>

                <Card className="p-0">
                    {disciplines.data.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="max-w-[300px]">Description</TableHead>
                                    <TableHead className="text-right">Topics</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {disciplines.data.map((discipline) => (
                                    <TableRow key={discipline.id}>
                                        <TableCell className="font-medium">{discipline.name}</TableCell>
                                        <TableCell>
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                                {discipline.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <span className="line-clamp-1">{discipline.description || '—'}</span>
                                        </TableCell>
                                        <TableCell className="text-right">{discipline.canonical_topics_count ?? 0}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.disciplines.edit', discipline.id)}>
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
                            <Shapes className="size-10 text-muted-foreground/50" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">No disciplines found</p>
                            <p className="mt-1 text-sm text-muted-foreground/70">
                                Try adjusting your search criteria.
                            </p>
                        </div>
                    )}
                </Card>

                <Pagination meta={disciplines.meta} links={disciplines.links} />
            </div>
        </AdminLayout>
    );
}
