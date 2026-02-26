import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BrowseAppliedFilters, BrowseFilterOptions } from '@/types/student-questions';

interface FilterBarProps {
    filterOptions: BrowseFilterOptions;
    appliedFilters: BrowseAppliedFilters;
    onFilterChange: (key: string, value: string | undefined) => void;
}

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

export function FilterBar({ filterOptions, appliedFilters, onFilterChange }: FilterBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />

            {filterOptions.institutions.length > 1 && (
                <Select value={appliedFilters.institution_id ?? 'all'} onValueChange={(v) => onFilterChange('institution_id', v === 'all' ? undefined : v)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Institution" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Institutions</SelectItem>
                        {filterOptions.institutions.map((inst) => (
                            <SelectItem key={inst.id} value={inst.id}>{inst.abbreviation}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <Select value={appliedFilters.course_id ?? 'all'} onValueChange={(v) => onFilterChange('course_id', v === 'all' ? undefined : v)}>
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

            {filterOptions.years.length > 0 && (
                <Select value={appliedFilters.year ?? 'all'} onValueChange={(v) => onFilterChange('year', v === 'all' ? undefined : v)}>
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
            )}

            <Select value={appliedFilters.semester ?? 'all'} onValueChange={(v) => onFilterChange('semester', v === 'all' ? undefined : v)}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="first">1st Semester</SelectItem>
                    <SelectItem value="second">2nd Semester</SelectItem>
                </SelectContent>
            </Select>

            {filterOptions.topics.length > 0 && (
                <Select value={appliedFilters.topic_id ?? 'all'} onValueChange={(v) => onFilterChange('topic_id', v === 'all' ? undefined : v)}>
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
            )}

            <Select value={appliedFilters.difficulty ?? 'all'} onValueChange={(v) => onFilterChange('difficulty', v === 'all' ? undefined : v)}>
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

            <Select value={appliedFilters.type ?? 'all'} onValueChange={(v) => onFilterChange('type', v === 'all' ? undefined : v)}>
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
        </div>
    );
}
