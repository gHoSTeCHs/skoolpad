import { X } from 'lucide-react';
import type { BrowseAppliedFilters, BrowseFilterOptions } from '@/types/student-questions';

interface ActiveFiltersProps {
    filters: BrowseAppliedFilters;
    filterOptions: BrowseFilterOptions;
    onRemove: (key: string) => void;
}

export function ActiveFilters({ filters, filterOptions, onRemove }: ActiveFiltersProps) {
    const chips: { key: string; label: string }[] = [];

    if (filters.institution_id) {
        const inst = filterOptions.institutions.find((i) => i.id === filters.institution_id);
        if (inst) chips.push({ key: 'institution_id', label: inst.abbreviation });
    }

    if (filters.course_id) {
        const course = filterOptions.courses.find((c) => c.id === filters.course_id);
        if (course) chips.push({ key: 'course_id', label: course.course_code });
    }

    if (filters.year) {
        chips.push({ key: 'year', label: `Year: ${filters.year}` });
    }

    if (filters.semester) {
        chips.push({ key: 'semester', label: filters.semester === 'first' ? '1st Semester' : '2nd Semester' });
    }

    if (filters.topic_id) {
        const topic = filterOptions.topics.find((t) => t.id === filters.topic_id);
        if (topic) chips.push({ key: 'topic_id', label: topic.title });
    }

    if (filters.difficulty) {
        chips.push({ key: 'difficulty', label: `${filters.difficulty.charAt(0).toUpperCase()}${filters.difficulty.slice(1)}` });
    }

    if (filters.type) {
        chips.push({ key: 'type', label: filters.type.toUpperCase().replace('_', ' ') });
    }

    if (filters.search) {
        chips.push({ key: 'search', label: `"${filters.search}"` });
    }

    if (chips.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Active filters:
            </span>
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                >
                    {chip.label}
                    <button
                        type="button"
                        onClick={() => onRemove(chip.key)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                    >
                        <X className="size-3" />
                    </button>
                </span>
            ))}
        </div>
    );
}
