import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Clock, Filter, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { browse as topicsBrowse, show as topicShow } from '@/actions/App/Http/Controllers/Student/TopicController';
import EmptyState from '@/components/skoolpad/empty-state';
import { DifficultyBadge } from '@/components/skoolpad/block-tree';
import SpBadge from '@/components/skoolpad/sp-badge';
import { Pagination } from '@/components/admin/pagination';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { BrowseTopic, TopicBrowseProps } from '@/types/student-topics';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Topics', href: topicsBrowse.url() },
];

export default function TopicsBrowse({ topics, filterOptions, appliedFilters, totalCount, completedCount }: TopicBrowseProps) {
    const [searchValue, setSearchValue] = useState(appliedFilters.search ?? '');
    const isInitialMount = useRef(true);
    const browseAll = appliedFilters.browse_all === 'true';

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            navigateWithFilters({ search: searchValue || undefined });
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchValue]);

    function navigateWithFilters(overrides: Record<string, string | undefined>) {
        const params: Record<string, string | undefined> = {
            ...appliedFilters,
            ...overrides,
        };

        Object.keys(params).forEach((k) => {
            if (!params[k]) delete params[k];
        });

        router.get(topicsBrowse.url(), params, { preserveState: true, preserveScroll: true, replace: true });
    }

    function handleFilterChange(key: string, value: string | undefined) {
        const overrides: Record<string, string | undefined> = { [key]: value };

        if (key === 'browse_all') {
            overrides.course_id = undefined;
            overrides.discipline_id = undefined;
        }

        navigateWithFilters(overrides);
    }

    function handleBrowseAllChange(checked: boolean | 'indeterminate') {
        handleFilterChange('browse_all', checked === true ? 'true' : undefined);
    }

    function clearAllFilters() {
        setSearchValue('');
        router.get(topicsBrowse.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    const hasActiveFilters = Object.entries(appliedFilters).some(
        ([key, val]) => key !== 'search' && val != null && val !== '',
    );

    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Browse Topics" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        Browse Topics
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {browseAll
                            ? 'Exploring all topics at your institution.'
                            : 'Topics from your enrolled courses.'}
                    </p>
                </div>

                {totalCount > 0 && (
                    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                        <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                                <span className="text-[13px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                                    {completedCount} of {totalCount} topics completed
                                </span>
                                <span className="text-[12px] text-muted-foreground">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="mt-2 h-2" />
                        </div>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Search topics..."
                        className="pl-9 pr-9"
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => setSearchValue('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="browse_all"
                        checked={browseAll}
                        onCheckedChange={handleBrowseAllChange}
                    />
                    <Label htmlFor="browse_all" className="cursor-pointer text-[13px]" style={{ fontFamily: 'var(--font-body)' }}>
                        Browse all topics at my institution
                    </Label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="size-4 text-muted-foreground" />

                    {!browseAll && filterOptions.courses.length > 0 && (
                        <Select value={appliedFilters.course_id ?? 'all'} onValueChange={(v) => handleFilterChange('course_id', v === 'all' ? undefined : v)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Courses</SelectItem>
                                {filterOptions.courses.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.course_code}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {browseAll && filterOptions.disciplines.length > 0 && (
                        <Select value={appliedFilters.discipline_id ?? 'all'} onValueChange={(v) => handleFilterChange('discipline_id', v === 'all' ? undefined : v)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Discipline" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Disciplines</SelectItem>
                                {filterOptions.disciplines.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Select value={appliedFilters.difficulty ?? 'all'} onValueChange={(v) => handleFilterChange('difficulty', v === 'all' ? undefined : v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            {filterOptions.difficulties.map((d) => (
                                <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={appliedFilters.completion ?? 'all'} onValueChange={(v) => handleFilterChange('completion', v === 'all' ? undefined : v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Completion" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="not_started">Not Started</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {topics.meta.total} topic{topics.meta.total !== 1 ? 's' : ''} found
                    </span>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-[12px]">
                            Clear all filters
                        </Button>
                    )}
                </div>

                {topics.data.length > 0 ? (
                    <div className="space-y-2">
                        {topics.data.map((topic) => (
                            <TopicCard key={topic.id} topic={topic} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={'\uD83D\uDCDA'}
                        title={hasActiveFilters ? 'No topics match your filters' : 'No topics available'}
                        description={hasActiveFilters ? 'Try adjusting your filters or search terms.' : 'Topics will appear here once they are mapped to your enrolled courses.'}
                        actionLabel={hasActiveFilters ? 'Clear all filters' : undefined}
                        onAction={hasActiveFilters ? clearAllFilters : undefined}
                    />
                )}

                {topics.meta.last_page > 1 && (
                    <Pagination meta={topics.meta} links={topics.links} />
                )}
            </div>
        </AppLayout>
    );
}

function TopicCard({ topic }: { topic: BrowseTopic }) {
    const hasSingleCourse = topic.courses.length === 1;
    const courseParam = hasSingleCourse ? `?course=${topic.courses[0].id}` : '';
    const href = `/topics/${topic.id}${courseParam}`;

    const blockProgress = topic.total_blocks > 0
        ? Math.round((topic.completed_blocks / topic.total_blocks) * 100)
        : 0;

    return (
        <Link
            href={href}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
            style={{ borderRadius: 'var(--card-radius)' }}
            prefetch
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className="truncate text-[14px] font-medium"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {topic.title}
                    </span>
                    {topic.total_blocks > 0 ? (
                        topic.completed_blocks >= topic.total_blocks ? (
                            <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                        ) : topic.completed_blocks > 0 ? (
                            <span className="shrink-0 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {topic.completed_blocks}/{topic.total_blocks}
                            </span>
                        ) : null
                    ) : (
                        topic.is_completed && (
                            <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                        )
                    )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                    {topic.difficulty_level && (
                        <DifficultyBadge level={topic.difficulty_level} />
                    )}
                    {topic.discipline && (
                        <SpBadge variant="neutral" className="px-[6px] py-0 text-[9px]">
                            {topic.discipline.name}
                        </SpBadge>
                    )}
                    {topic.estimated_read_minutes && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            <Clock className="size-3" />
                            {topic.estimated_read_minutes} min
                        </span>
                    )}
                    {topic.question_count > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            <BookOpen className="size-3" />
                            {topic.question_count} Q{topic.question_count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {topic.total_blocks > 0 && topic.completed_blocks > 0 && topic.completed_blocks < topic.total_blocks && (
                    <Progress value={blockProgress} className="mt-2 h-1.5" />
                )}

                {topic.courses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {topic.courses.map((course) => (
                            <span
                                key={course.id}
                                className="inline-block rounded-sm bg-[var(--bg-raised)] px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                {course.course_code}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
