import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GradeBoundary, ProjectedGradeEntry } from '@/types/cgpa';
import { X } from 'lucide-react';

interface CourseGradeRowProps {
    entry: ProjectedGradeEntry;
    index: number;
    gradeBoundaries: GradeBoundary[];
    onChange: (index: number, field: keyof ProjectedGradeEntry, value: string | number) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
}

export function CourseGradeRow({ entry, index, gradeBoundaries, onChange, onRemove, canRemove }: CourseGradeRowProps) {
    return (
        <div className="group flex items-start gap-2">
            <div className="grid flex-1 grid-cols-[1fr_1fr_80px_100px] gap-2 sm:grid-cols-[minmax(80px,1fr)_minmax(120px,2fr)_80px_100px]">
                <Input
                    placeholder="CSC 301"
                    value={entry.course_code}
                    onChange={(e) => onChange(index, 'course_code', e.target.value)}
                    className="text-sm"
                />
                <Input
                    placeholder="Course title"
                    value={entry.course_title ?? ''}
                    onChange={(e) => onChange(index, 'course_title', e.target.value)}
                    className="text-sm"
                />
                <Input
                    type="number"
                    placeholder="Units"
                    min={1}
                    max={12}
                    value={entry.credit_units || ''}
                    onChange={(e) => onChange(index, 'credit_units', parseInt(e.target.value) || 0)}
                    className="text-center text-sm"
                />
                <Select value={entry.grade} onValueChange={(v) => onChange(index, 'grade', v)}>
                    <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                        {gradeBoundaries.map((b) => (
                            <SelectItem key={b.label} value={b.label}>
                                {b.label} ({b.gp})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="mt-0.5 size-8 shrink-0 text-muted-foreground transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                onClick={() => onRemove(index)}
                disabled={!canRemove}
                aria-label="Remove course"
            >
                <X className="size-4" />
            </Button>
        </div>
    );
}
