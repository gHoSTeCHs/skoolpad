import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Eye, MoreHorizontal, Pencil, TreePine } from 'lucide-react';
import CanonicalTopicController from '@/actions/App/Http/Controllers/Admin/CanonicalTopicController';
import ContentBlockController from '@/actions/App/Http/Controllers/Admin/ContentBlockController';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFilterHandlers, type BaseFilters } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import type { PaginatedData } from '@/types/models';
import type { Discipline, TopicListItem } from '@/types/topics';

interface Filters extends BaseFilters {
    discipline_id?: string;
    difficulty_level?: string;
    is_published?: string;
}

interface Props {
    topics: PaginatedData<TopicListItem>;
    disciplines: Discipline[];
    filters: Filters;
}

const breadcrumbs = [{ title: 'Topics', href: '/admin/topics' }];

const difficultyStyles: Record<string, string> = {
    foundational:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    intermediate: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    advanced: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

const columns: ColumnDef<TopicListItem>[] = [
    {
        id: 'title',
        header: 'Title',
        cell: (row) => (
            <div>
                <span className="font-medium">{row.title}</span>
                {row.parent && (
                    <span className="block text-xs text-muted-foreground">
                        ↳ {row.parent.title}
                    </span>
                )}
            </div>
        ),
        sortable: true,
    },
    {
        id: 'discipline',
        header: 'Discipline',
        cell: (row) => row.discipline?.name ?? '—',
    },
    {
        id: 'difficulty_level',
        header: 'Difficulty',
        cell: (row) => (
            <Badge
                variant="secondary"
                className={difficultyStyles[row.difficulty_level] ?? ''}
            >
                {row.difficulty_level_label}
            </Badge>
        ),
        sortable: true,
    },
    {
        id: 'is_published',
        header: 'Status',
        cell: (row) => (
            <Badge
                variant={row.is_published ? 'default' : 'secondary'}
                className={
                    row.is_published
                        ? 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)]'
                        : 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)]'
                }
            >
                {row.is_published ? 'Published' : 'Draft'}
            </Badge>
        ),
    },
    {
        id: 'estimated_read_minutes',
        header: 'Read Time',
        cell: (row) =>
            row.estimated_read_minutes
                ? `${row.estimated_read_minutes} min`
                : '—',
        align: 'right',
    },
    {
        id: 'created_at',
        header: 'Created',
        cell: (row) => formatDate(row.created_at),
        sortable: true,
    },
];

export default function AdminTopics({ topics, disciplines, filters }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: CanonicalTopicController.index.url(),
        filters,
    });

    function handleTogglePublish(topicId: string) {
        router.post(
            CanonicalTopicController.togglePublish.url(topicId),
            {},
            { preserveScroll: true },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Topics" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Topics"
                    action={{
                        label: 'Create Topic',
                        href: CanonicalTopicController.create.url(),
                    }}
                />

                <DataTable
                    columns={columns}
                    paginatedData={topics}
                    getRowKey={(row) => row.id}
                    toolbar={
                        <div className="flex flex-wrap items-center gap-3">
                            <SearchInput
                                value={filters.search ?? ''}
                                routeUrl={CanonicalTopicController.index.url()}
                                placeholder="Search topics..."
                                queryParams={{
                                    discipline_id: filters.discipline_id,
                                    difficulty_level: filters.difficulty_level,
                                    is_published: filters.is_published,
                                    sort: filters.sort,
                                    direction: filters.direction,
                                }}
                            />
                            <Select
                                value={filters.discipline_id ?? ''}
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'discipline_id',
                                        value === 'all' ? undefined : value,
                                    )
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Disciplines" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Disciplines
                                    </SelectItem>
                                    {disciplines.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.difficulty_level ?? ''}
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'difficulty_level',
                                        value === 'all' ? undefined : value,
                                    )
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Difficulty
                                    </SelectItem>
                                    <SelectItem value="foundational">
                                        Foundational
                                    </SelectItem>
                                    <SelectItem value="intermediate">
                                        Intermediate
                                    </SelectItem>
                                    <SelectItem value="advanced">
                                        Advanced
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.is_published ?? ''}
                                onValueChange={(value) =>
                                    handleFilterChange(
                                        'is_published',
                                        value === 'all' ? undefined : value,
                                    )
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="1">Published</SelectItem>
                                    <SelectItem value="0">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    }
                    renderActions={(row) => (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                >
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={CanonicalTopicController.edit.url(
                                            row.id,
                                        )}
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={CanonicalTopicController.preview.url(
                                            row.id,
                                        )}
                                    >
                                        <Eye className="size-4" />
                                        Preview
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={ContentBlockController.index.url(
                                            row.id,
                                        )}
                                    >
                                        <TreePine className="size-4" />
                                        Manage Blocks
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleTogglePublish(row.id)}
                                >
                                    {row.is_published ? 'Unpublish' : 'Publish'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    emptyState={{
                        icon: BookOpen,
                        title: 'No topics found',
                        description:
                            'Try adjusting your search or filter criteria.',
                    }}
                />
            </div>
        </AdminLayout>
    );
}
