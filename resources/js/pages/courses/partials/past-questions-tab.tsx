import { router } from '@inertiajs/react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/skoolpad/empty-state';
import { QuestionCardExpandable } from '@/pages/courses/partials/question-card-expandable';
import { show as courseShow } from '@/actions/App/Http/Controllers/Student/CourseController';
import type { AppliedFilters, CourseFilterOptions, CourseQuestion } from '@/types/student-courses';
import type { PaginatedData } from '@/types/models';

interface PastQuestionsTabProps {
    courseId: string;
    questions: PaginatedData<CourseQuestion>;
    filterOptions: CourseFilterOptions;
    appliedFilters: AppliedFilters;
}

export function PastQuestionsTab({ courseId, questions, filterOptions, appliedFilters }: PastQuestionsTabProps) {
    function applyFilter(key: string, value: string | undefined) {
        const params: Record<string, string | undefined> = {
            ...appliedFilters,
            tab: 'past_questions',
            [key]: value,
        };

        Object.keys(params).forEach((k) => {
            if (!params[k]) delete params[k];
        });

        router.get(courseShow.url(courseId), params, { preserveState: true, preserveScroll: true, replace: true });
    }

    function clearFilters() {
        router.get(courseShow.url(courseId), { tab: 'past_questions' }, { preserveState: true, preserveScroll: true, replace: true });
    }

    const hasActiveFilters = Object.values(appliedFilters).some((v) => v);

    const difficultyOptions = [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
    ];

    const typeOptions = [
        { value: 'mcq', label: 'MCQ' },
        { value: 'multi_select_mcq', label: 'Multi-select' },
        { value: 'theory', label: 'Theory' },
        { value: 'short_answer', label: 'Short Answer' },
        { value: 'essay', label: 'Essay' },
        { value: 'fill_blank', label: 'Fill in Blank' },
        { value: 'true_false', label: 'True/False' },
        { value: 'calculation', label: 'Calculation' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />

                <Select value={appliedFilters.year ?? 'all'} onValueChange={(v) => applyFilter('year', v === 'all' ? undefined : v)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {filterOptions.years.map((year) => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={appliedFilters.semester ?? 'all'} onValueChange={(v) => applyFilter('semester', v === 'all' ? undefined : v)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        <SelectItem value="first">1st Semester</SelectItem>
                        <SelectItem value="second">2nd Semester</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={appliedFilters.topic ?? 'all'} onValueChange={(v) => applyFilter('topic', v === 'all' ? undefined : v)}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Topic" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {filterOptions.topics.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={appliedFilters.difficulty ?? 'all'} onValueChange={(v) => applyFilter('difficulty', v === 'all' ? undefined : v)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {difficultyOptions.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={appliedFilters.type ?? 'all'} onValueChange={(v) => applyFilter('type', v === 'all' ? undefined : v)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {typeOptions.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-[12px]">
                        <X className="size-3" /> Clear
                    </Button>
                )}
            </div>

            <div className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {questions.meta.total} question{questions.meta.total !== 1 ? 's' : ''} found
            </div>

            {questions.data.length > 0 ? (
                <div className="space-y-3">
                    {questions.data.map((question) => (
                        <QuestionCardExpandable key={question.id} question={question} />
                    ))}

                    {questions.links.next && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                onClick={() => router.get(questions.links.next!, {}, { preserveState: true, preserveScroll: true })}
                            >
                                Load more
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState
                    icon={'\u2753'}
                    title="No questions found"
                    description={hasActiveFilters ? 'Try adjusting your filters.' : 'No past questions have been added for this course yet.'}
                    actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
                    onAction={hasActiveFilters ? clearFilters : undefined}
                />
            )}
        </div>
    );
}
