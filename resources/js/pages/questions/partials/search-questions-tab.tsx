import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EmptyState from '@/components/skoolpad/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionCardExpandable } from '@/pages/courses/partials/question-card-expandable';
import { ActiveFilters } from '@/pages/questions/partials/active-filters';
import { FilterBar } from '@/pages/questions/partials/filter-bar';
import { index as questionsIndex } from '@/actions/App/Http/Controllers/Student/QuestionController';
import type { QuestionBrowserProps, BrowseQuestion } from '@/types/student-questions';

export function SearchQuestionsTab({ questions, filterOptions, appliedFilters, totalCount }: QuestionBrowserProps) {
    const [searchValue, setSearchValue] = useState(appliedFilters.search ?? '');
    const [loadedQuestions, setLoadedQuestions] = useState<BrowseQuestion[]>(questions.data);
    const [nextCursor, setNextCursor] = useState(questions.next_cursor);
    const [hasMore, setHasMore] = useState(questions.has_more);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const isInitialMount = useRef(true);

    useEffect(() => {
        setLoadedQuestions(questions.data);
        setNextCursor(questions.next_cursor);
        setHasMore(questions.has_more);
    }, [questions]);

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

        router.get(questionsIndex.url(), params, { preserveState: true, preserveScroll: true, replace: true });
    }

    function handleFilterChange(key: string, value: string | undefined) {
        navigateWithFilters({ [key]: value });
    }

    function handleRemoveFilter(key: string) {
        if (key === 'search') {
            setSearchValue('');
        }
        navigateWithFilters({ [key]: undefined });
    }

    function clearAllFilters() {
        setSearchValue('');
        router.get(questionsIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    function loadMore() {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        router.get(
            questionsIndex.url(),
            { ...appliedFilters, cursor: nextCursor },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onSuccess: (page) => {
                    const newData = (page.props as unknown as QuestionBrowserProps).questions;
                    setLoadedQuestions((prev) => [...prev, ...newData.data]);
                    setNextCursor(newData.next_cursor);
                    setHasMore(newData.has_more);
                    setIsLoadingMore(false);
                },
            },
        );
    }

    const hasActiveFilters = Object.keys(appliedFilters).length > 0;

    return (
        <div className="flex flex-col gap-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search questions..."
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

            <FilterBar
                filterOptions={filterOptions}
                appliedFilters={appliedFilters}
                onFilterChange={handleFilterChange}
            />

            <ActiveFilters
                filters={appliedFilters}
                filterOptions={filterOptions}
                onRemove={handleRemoveFilter}
            />

            <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    {totalCount} question{totalCount !== 1 ? 's' : ''} available
                </span>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-[12px]">
                        Clear all filters
                    </Button>
                )}
            </div>

            {loadedQuestions.length > 0 ? (
                <div className="space-y-3">
                    {loadedQuestions.map((question) => (
                        <QuestionCardExpandable
                            key={question.id}
                            question={{
                                id: question.id,
                                content: question.content,
                                question_type: question.question_type,
                                year: question.year,
                                semester: question.semester,
                                difficulty_level: question.difficulty_level,
                                marks: question.marks,
                                topic_links: question.topic_links,
                                answers: question.answers,
                            }}
                            showCourseBadge
                            courseCode={question.institution_course?.course_code}
                            institutionAbbreviation={question.institution_course?.institution?.abbreviation}
                        />
                    ))}

                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                                {isLoadingMore ? 'Loading...' : 'Load more questions'}
                            </Button>
                        </div>
                    )}

                    {isLoadingMore && (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-5 w-10" />
                                    </div>
                                    <Skeleton className="mt-3 h-4 w-3/4" />
                                    <Skeleton className="mt-2 h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState
                    icon={'\u2753'}
                    title={hasActiveFilters ? 'No questions match your filters' : 'No questions available'}
                    description={hasActiveFilters ? 'Try adjusting your filters or search terms.' : 'Past questions will appear here once they are added to your enrolled courses.'}
                    actionLabel={hasActiveFilters ? 'Clear all filters' : undefined}
                    onAction={hasActiveFilters ? clearAllFilters : undefined}
                />
            )}
        </div>
    );
}
