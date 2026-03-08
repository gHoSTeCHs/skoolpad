import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ExamPeriodEntry } from '@/hooks/use-exam-period';
import { CalendarDays, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

interface ExamDayModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dateKey: string;
    entries: ExamPeriodEntry[];
    onAddEntry: (entry: Omit<ExamPeriodEntry, 'id'>) => void;
    onRemoveEntry: (id: string) => void;
    courses?: { code: string; name: string }[];
}

function formatDisplayDate(dateKey: string): string {
    if (!dateKey) return '';
    const d = new Date(dateKey + 'T00:00:00');
    return d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return m > 0 ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

export function ExamDayModal({
    open,
    onOpenChange,
    dateKey,
    entries,
    onAddEntry,
    onRemoveEntry,
    courses,
}: ExamDayModalProps) {
    const [courseCode, setCourseCode] = useState('');
    const [courseName, setCourseName] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        setCourseCode('');
        setCourseName('');
        setTime('');
    }, [open, dateKey]);

    function handleQuickAdd() {
        onAddEntry({
            date: dateKey,
            time: time,
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            venue: '',
            notes: '',
        });
        setCourseCode('');
        setCourseName('');
        setTime('');
    }

    function handleCourseCodeChange(value: string) {
        setCourseCode(value);
        if (courses) {
            const match = courses.find((c) => c.code.toLowerCase() === value.toLowerCase());
            if (match) {
                setCourseName(match.name);
            }
        }
    }

    const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <CalendarDays className="size-4" />
                        </span>
                        {formatDisplayDate(dateKey)}
                    </DialogTitle>
                </DialogHeader>

                {entries.length > 0 ? (
                    <div className="mt-4 space-y-2">
                        {sorted.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-start gap-3 rounded-xl border border-l-2 border-border border-l-destructive/50 px-4 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">{entry.courseCode}</span>
                                        {entry.time && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock size={10} />
                                                {formatShortTime(entry.time)}
                                            </span>
                                        )}
                                    </div>
                                    {entry.courseName && (
                                        <p className="text-xs text-muted-foreground">{entry.courseName}</p>
                                    )}
                                    {entry.venue && (
                                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <MapPin size={10} />
                                            {entry.venue}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => onRemoveEntry(entry.id)}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
                        <CalendarDays className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No exams scheduled for this day.</p>
                    </div>
                )}

                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Quick Add
                    </p>
                    <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1.5">
                            <Input
                                value={courseCode}
                                onChange={(e) => handleCourseCodeChange(e.target.value)}
                                placeholder="Course code"
                                className="h-8 text-xs"
                                list={courses ? 'course-list' : undefined}
                            />
                            {courses && (
                                <datalist id="course-list">
                                    {courses.map((c) => (
                                        <option key={c.code} value={c.code} />
                                    ))}
                                </datalist>
                            )}
                            {courseCode && (
                                <Input
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    placeholder="Course name (optional)"
                                    className="h-8 text-xs"
                                />
                            )}
                        </div>
                        <div className="w-24 space-y-1.5">
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <Button
                            size="sm"
                            className="h-8 shrink-0 gap-1"
                            disabled={!courseCode.trim()}
                            onClick={handleQuickAdd}
                        >
                            <Plus className="size-3" />
                            Add
                        </Button>
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
