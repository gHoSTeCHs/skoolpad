import { Head, Link } from '@inertiajs/react';
import { BookOpen, GraduationCap, Plus, Sparkles } from 'lucide-react';
import ContentStudioController from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFilterHandlers } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import type { PaginatedData } from '@/types/models';
import type {
    ContentProject,
    ContentProjectStatus,
    EnumOption,
} from '@/types/content-studio';
import type { BaseFilters } from '@/hooks/use-filter-handlers';

interface Filters extends BaseFilters {
    mode?: string;
    status?: string;
}

interface Props {
    projects: PaginatedData<ContentProject>;
    filters: Filters;
    modeOptions: EnumOption[];
}

const STATUS_STYLES: Record<ContentProjectStatus, string> = {
    draft: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    research:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300',
    structuring:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    generating:
        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 reader:bg-purple-900/40 reader:text-purple-300',
    reviewing:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 reader:bg-orange-900/40 reader:text-orange-300',
    complete: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
};

const STATUS_OPTIONS: EnumOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'research', label: 'Research' },
    { value: 'structuring', label: 'Structuring' },
    { value: 'generating', label: 'Generating' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'complete', label: 'Complete' },
];

const breadcrumbs = [{ title: 'Content Studio', href: '#' }];

export default function ContentStudioIndex({
    projects,
    filters,
    modeOptions,
}: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } =
        useFilterHandlers({
            indexUrl: ContentStudioController.index.url(),
            filters,
        });

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Content Studio" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            Content Studio
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            AI-powered curriculum builder. Create and manage
                            content projects.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={ContentStudioController.create.url()}>
                            <Plus className="mr-2 size-4" />
                            New Project
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={filters.mode ?? 'all'}
                        onValueChange={(value) =>
                            handleFilterChange(
                                'mode',
                                value === 'all' ? undefined : value,
                            )
                        }
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All modes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All modes</SelectItem>
                            {modeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(value) =>
                            handleFilterChange(
                                'status',
                                value === 'all' ? undefined : value,
                            )
                        }
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
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

                {projects.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 rounded-full bg-muted p-4">
                                <Sparkles className="size-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-display text-lg font-semibold">
                                No content projects yet
                            </h3>
                            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                Create your first project to start building
                                curriculum with AI assistance.
                            </p>
                            <Button asChild className="mt-6">
                                <Link
                                    href={ContentStudioController.create.url()}
                                >
                                    <Plus className="mr-2 size-4" />
                                    Create Project
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.data.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

interface ProjectCardProps {
    project: ContentProject;
}

function ProjectCard({ project }: ProjectCardProps) {
    const isSecondary = project.mode === 'secondary';
    const title = isSecondary
        ? project.curriculum_subject_name
        : project.discipline_name;
    const subtitle = isSecondary ? project.education_level_name : 'Tertiary';

    return (
        <Link
            href={ContentStudioController.show.url({
                contentProject: project.id,
            })}
        >
            <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div
                                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                                    isSecondary
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 reader:bg-amber-900/30 reader:text-amber-400'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400'
                                }`}
                            >
                                {isSecondary ? (
                                    <BookOpen className="size-4" />
                                ) : (
                                    <GraduationCap className="size-4" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-medium text-foreground group-hover:text-primary">
                                    {title ?? 'Untitled'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className={STATUS_STYLES[project.status]}
                        >
                            {project.status_label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {project.mode_label}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>{project.created_by_name}</span>
                        <span>{formatDate(project.created_at)}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
