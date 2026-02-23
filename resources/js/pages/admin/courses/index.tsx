import { Head, Link } from '@inertiajs/react';
import { GraduationCap, MoreHorizontal, Pencil } from 'lucide-react';
import CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { SearchInput } from '@/components/admin/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterHandlers, type BaseFilters } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import type { PaginatedData } from '@/types/models';
import type { CourseListItem, CourseSemester, CourseScope, InstitutionOption } from '@/types/courses';

interface Filters extends BaseFilters {
    institution_id?: string;
    level?: string;
    semester?: string;
    course_scope?: string;
}

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    courses: PaginatedData<CourseListItem>;
    institutions: InstitutionOption[];
    course_scopes: EnumOption[];
    filters: Filters;
}

const breadcrumbs = [{ title: 'Courses', href: '/admin/courses' }];

const semesterLabels: Record<CourseSemester, string> = {
    first: 'First',
    second: 'Second',
    both: 'Both',
};

const scopeStyles: Record<CourseScope, string> = {
    department: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    faculty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 reader:bg-purple-900/30 reader:text-purple-400',
    institution_wide: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
};

const columns: ColumnDef<CourseListItem>[] = [
    {
        id: 'course_code',
        header: 'Code',
        cell: (row) => <span className="font-medium">{row.course_code}</span>,
        sortable: true,
    },
    {
        id: 'course_title',
        header: 'Title',
        cell: (row) => row.course_title,
        sortable: true,
    },
    {
        id: 'institution',
        header: 'Institution',
        cell: (row) => row.institution?.abbreviation ?? '—',
    },
    {
        id: 'owning_department',
        header: 'Department',
        cell: (row) => row.owning_department?.name ?? '—',
    },
    {
        id: 'level',
        header: 'Level',
        cell: (row) => row.level,
        sortable: true,
    },
    {
        id: 'semester',
        header: 'Semester',
        cell: (row) => semesterLabels[row.semester] ?? row.semester,
        sortable: true,
    },
    {
        id: 'credit_units',
        header: 'Credits',
        cell: (row) => row.credit_units ?? '—',
        align: 'right',
    },
    {
        id: 'course_scope',
        header: 'Scope',
        cell: (row) => (
            <Badge
                variant="secondary"
                className={scopeStyles[row.course_scope] ?? ''}
            >
                {row.course_scope_label}
            </Badge>
        ),
    },
    {
        id: 'topics_count',
        header: 'Topics',
        cell: (row) => row.topics_count,
        align: 'right',
    },
];

export default function AdminCourses({ courses, institutions, course_scopes, filters }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: CourseController.index.url(),
        filters,
    });

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Courses" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Courses"
                    action={{ label: 'Create Course', href: CourseController.create.url() }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={courses}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={CourseController.index.url()}
                                placeholder="Search courses..."
                                queryParams={{
                                    institution_id: filters.institution_id,
                                    level: filters.level,
                                    semester: filters.semester,
                                    course_scope: filters.course_scope,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.institution_id ?? ''}
                                onValueChange={(value) => handleFilterChange('institution_id', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Institutions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Institutions</SelectItem>
                                    {institutions.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.abbreviation}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.level ?? ''}
                                onValueChange={(value) => handleFilterChange('level', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    {[100, 200, 300, 400, 500].map((lvl) => (
                                        <SelectItem key={lvl} value={String(lvl)}>
                                            {lvl} Level
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.semester ?? ''}
                                onValueChange={(value) => handleFilterChange('semester', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Semesters" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Semesters</SelectItem>
                                    <SelectItem value="first">First</SelectItem>
                                    <SelectItem value="second">Second</SelectItem>
                                    <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.course_scope ?? ''}
                                onValueChange={(value) => handleFilterChange('course_scope', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[170px]">
                                    <SelectValue placeholder="All Scopes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Scopes</SelectItem>
                                    {course_scopes.map((scope) => (
                                        <SelectItem key={scope.value} value={scope.value}>
                                            {scope.label}
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={CourseController.edit.url(row.id)}>
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    emptyState={{
                        icon: GraduationCap,
                        title: 'No courses found',
                        description: 'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
