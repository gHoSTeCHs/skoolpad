import { Link, router } from '@inertiajs/react';
import { BookOpen, Clock, FileText, Layers } from 'lucide-react';
import { Pagination } from '@/components/admin/pagination';
import EmptyState from '@/components/skoolpad/empty-state';
import SpBadge from '@/components/skoolpad/sp-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index as papersIndex, show as paperShow } from '@/actions/App/Http/Controllers/Student/QuestionPaperController';
import type { PapersTabProps } from '@/types/student-questions';

export function PapersTab({ papers, paperFilterOptions, paperFilters, paperCount }: PapersTabProps) {
    function handleFilterChange(key: string, value: string | undefined) {
        const params: Record<string, string | undefined> = {
            ...paperFilters,
            [key]: value,
        };

        Object.keys(params).forEach((k) => {
            if (!params[k]) delete params[k];
        });

        router.get(papersIndex.url(), params, { preserveState: true, preserveScroll: true, replace: true });
    }

    function clearAllFilters() {
        router.get(papersIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    const hasActiveFilters = Object.values(paperFilters).some(Boolean);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
                <Select
                    value={paperFilters.course_id ?? 'all'}
                    onValueChange={(v) => handleFilterChange('course_id', v === 'all' ? undefined : v)}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {paperFilterOptions.courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.course_code}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {paperFilterOptions.years.length > 0 && (
                    <Select
                        value={paperFilters.year ?? 'all'}
                        onValueChange={(v) => handleFilterChange('year', v === 'all' ? undefined : v)}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {paperFilterOptions.years.map((year) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <Select
                    value={paperFilters.semester ?? 'all'}
                    onValueChange={(v) => handleFilterChange('semester', v === 'all' ? undefined : v)}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        <SelectItem value="First">1st Semester</SelectItem>
                        <SelectItem value="Second">2nd Semester</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {paperCount} paper{paperCount !== 1 ? 's' : ''} available
                </span>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-[12px]">
                        Clear all filters
                    </Button>
                )}
            </div>

            {papers.data.length > 0 ? (
                <div className="space-y-3">
                    {papers.data.map((paper) => (
                        <Link
                            key={paper.id}
                            href={paperShow.url(paper.id)}
                            className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                            style={{ borderRadius: 'var(--card-radius)' }}
                        >
                            <h3 className="font-display text-sm font-bold leading-tight">
                                {paper.title}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {paper.institution_course && (
                                    <SpBadge variant="reward">{paper.institution_course.course_code}</SpBadge>
                                )}
                                {paper.institution_course?.institution && (
                                    <SpBadge variant="neutral">{paper.institution_course.institution.abbreviation}</SpBadge>
                                )}
                                {paper.assessment_type && (
                                    <SpBadge variant="primary">{paper.assessment_type.name}</SpBadge>
                                )}
                                {paper.year && (
                                    <SpBadge variant="neutral">{paper.year}</SpBadge>
                                )}
                                {paper.semester && (
                                    <SpBadge variant="neutral">{paper.semester}</SpBadge>
                                )}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                {paper.total_marks > 0 && (
                                    <span className="flex items-center gap-1">
                                        <FileText className="size-3.5" />
                                        {paper.total_marks} marks
                                    </span>
                                )}
                                {paper.duration_minutes > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-3.5" />
                                        {paper.duration_minutes} min
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Layers className="size-3.5" />
                                    {paper.sections_count} section{paper.sections_count !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                    <BookOpen className="size-3.5" />
                                    {paper.questions_count} question{paper.questions_count !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </Link>
                    ))}

                    <Pagination meta={papers.meta} links={papers.links} />
                </div>
            ) : (
                <EmptyState
                    icon={'\uD83D\uDCC4'}
                    title={hasActiveFilters ? 'No papers match your filters' : 'No exam papers available'}
                    description={hasActiveFilters ? 'Try adjusting your filters.' : 'Exam papers will appear here once they are added to your enrolled courses.'}
                    actionLabel={hasActiveFilters ? 'Clear all filters' : undefined}
                    onAction={hasActiveFilters ? clearAllFilters : undefined}
                />
            )}
        </div>
    );
}
