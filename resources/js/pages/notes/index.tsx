import { Head, Link, router } from '@inertiajs/react';
import { Plus, StickyNote } from 'lucide-react';
import { create, index } from '@/actions/App/Http/Controllers/Student/NoteController';
import { Pagination } from '@/components/admin/pagination';
import { SearchInput } from '@/components/admin/search-input';
import EmptyState from '@/components/skoolpad/empty-state';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFilterHandlers } from '@/hooks/use-filter-handlers';
import AppLayout from '@/layouts/app-layout';
import { NoteCard } from '@/pages/notes/partials/note-card';
import type { BreadcrumbItem } from '@/types';
import type { NoteIndexProps } from '@/types/notes';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Notes', href: index.url() }];

export default function NotesIndex({ notes, filters, enrolledCourses, isSecondary }: NoteIndexProps) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: index.url(),
        filters,
    });

    if (isSecondary) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Notes" />
                <div className="flex flex-col gap-4 p-4 md:p-6">
                    <EmptyState
                        icon="📝"
                        title="Coming Soon"
                        description="Bookmarked topics and saved questions will be available soon."
                    />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notes" />

            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">Notes</h1>
                        <p
                            className="mt-1 text-[13px] text-muted-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            {notes.meta.total} {notes.meta.total === 1 ? 'note' : 'notes'}
                        </p>
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href={create.url()}>
                            <Plus className="size-4" />
                            New Note
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SearchInput
                        value={filters.search ?? ''}
                        routeUrl={index.url()}
                        placeholder="Search notes..."
                        queryParams={{
                            course_id: filters.course_id,
                            sort: filters.sort,
                            direction: filters.direction,
                        }}
                    />

                    {enrolledCourses.length > 0 && (
                        <Select
                            value={filters.course_id || 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('course_id', value === 'all' ? undefined : value)
                            }
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="All Courses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {enrolledCourses.map((course) => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.course_code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </div>

                {notes.data.length === 0 ? (
                    <EmptyState
                        icon="📝"
                        title="No notes yet"
                        description="Create your first note to start capturing what you learn."
                        actionLabel="Create Note"
                        onAction={() => router.visit(create.url())}
                    />
                ) : (
                    <div className="space-y-3">
                        {notes.data.map((note) => (
                            <NoteCard key={note.id} note={note} />
                        ))}
                    </div>
                )}

                <Pagination meta={notes.meta} links={notes.links} />
            </div>
        </AppLayout>
    );
}
