import { Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import OnboardingController from '@/actions/App/Http/Controllers/Student/OnboardingController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { SuggestedCourse } from '@/types/onboarding';

interface CoursesStepProps {
    selectedIds: string[];
    institutionId: string;
    departmentId: string;
    level: string;
    onToggle: (courseId: string) => void;
    onCoursesLoaded: React.Dispatch<React.SetStateAction<SuggestedCourse[]>>;
    onNext: () => void;
    onBack: () => void;
}

export default function CoursesStep({
    selectedIds,
    institutionId,
    departmentId,
    level,
    onToggle,
    onCoursesLoaded,
    onNext,
    onBack,
}: CoursesStepProps) {
    const [suggestions, setSuggestions] = useState<SuggestedCourse[]>([]);
    const [searchResults, setSearchResults] = useState<SuggestedCourse[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        async function fetchSuggestions() {
            setLoadingSuggestions(true);
            try {
                const response = await fetch(
                    OnboardingController.courseSuggestions.url({
                        query: { institution_id: institutionId, department_id: departmentId, level },
                    }),
                    { headers: { Accept: 'application/json' } },
                );
                if (!response.ok) return;
                const data = await response.json();
                setSuggestions(data);
                onCoursesLoaded(data as SuggestedCourse[]);
            } finally {
                setLoadingSuggestions(false);
            }
        }
        fetchSuggestions();
    }, [institutionId, departmentId, level]);

    const searchCourses = useCallback(async (term: string) => {
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(
                OnboardingController.searchCourses.url({
                    query: { institution_id: institutionId, q: term },
                }),
                { headers: { Accept: 'application/json' } },
            );
            if (!response.ok) return;
            const data = await response.json();
            setSearchResults(data);
            onCoursesLoaded((prev) => {
                const merged = [...prev];
                (data as SuggestedCourse[]).forEach((sr) => {
                    if (!merged.some((c) => c.id === sr.id)) {
                        merged.push(sr);
                    }
                });
                return merged;
            });
        } finally {
            setSearching(false);
        }
    }, [institutionId]);

    function handleSearchChange(term: string) {
        setSearchQuery(term);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchCourses(term), 300);
    }

    const allCourses = [...suggestions];
    searchResults.forEach((sr) => {
        if (!allCourses.some((c) => c.id === sr.id)) {
            allCourses.push(sr);
        }
    });

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Select your courses</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    We&apos;ve suggested courses for your level. You can also search to add more.
                </p>
            </div>

            <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search for additional courses..."
                    className="pl-10"
                />
                {searching && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>

            {loadingSuggestions ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
            ) : allCourses.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No courses found for your selection. Try searching above.
                </p>
            ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                    {allCourses.map((course) => {
                        const isSelected = selectedIds.includes(course.id);
                        return (
                            <label
                                key={course.id}
                                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => onToggle(course.id)}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">{course.course_code}</span>
                                        {course.is_elective && (
                                            <Badge variant="outline" className="text-[10px]">Elective</Badge>
                                        )}
                                        {course.credit_units && (
                                            <span className="text-xs text-muted-foreground">{course.credit_units} units</span>
                                        )}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">{course.course_title}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}

            {selectedIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                    {selectedIds.length} course{selectedIds.length !== 1 ? 's' : ''} selected
                </p>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={selectedIds.length === 0}>Continue</Button>
            </div>
        </div>
    );
}
