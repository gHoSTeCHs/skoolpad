import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { WeeklyScheduleSlot } from '@/hooks/use-weekly-schedule';
import { BookOpen, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

interface WeeklyScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template: WeeklyScheduleSlot[];
    onAddSlot: (slot: Omit<WeeklyScheduleSlot, 'id'>) => void;
    onRemoveSlot: (id: string) => void;
    slotsForDay: (dayOfWeek: number) => WeeklyScheduleSlot[];
    courses?: { code: string; name: string }[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_VALUES: (0 | 1 | 2 | 3 | 4 | 5 | 6)[] = [1, 2, 3, 4, 5, 6, 0];

function formatShortTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    return m > 0 ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

function formatTimeRange(start: string, end: string): string {
    const startFormatted = formatShortTime(start);
    const endFormatted = formatShortTime(end);
    if (!startFormatted && !endFormatted) return '';
    if (!endFormatted) return startFormatted;
    return `${startFormatted} – ${endFormatted}`;
}

export function WeeklyScheduleModal({
    open,
    onOpenChange,
    template,
    onAddSlot,
    onRemoveSlot,
    slotsForDay,
    courses,
}: WeeklyScheduleModalProps) {
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [courseCode, setCourseCode] = useState('');
    const [courseName, setCourseName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [venue, setVenue] = useState('');

    useEffect(() => {
        if (open) {
            setSelectedDay(1);
            setCourseCode('');
            setCourseName('');
            setStartTime('');
            setEndTime('');
            setVenue('');
        }
    }, [open]);

    function handleCourseCodeChange(value: string) {
        setCourseCode(value);
        if (courses) {
            const match = courses.find((c) => c.code.toLowerCase() === value.toLowerCase());
            if (match) {
                setCourseName(match.name);
            }
        }
    }

    function handleQuickAdd() {
        onAddSlot({
            dayOfWeek: selectedDay as WeeklyScheduleSlot['dayOfWeek'],
            startTime,
            endTime,
            courseCode: courseCode.trim(),
            courseName: courseName.trim(),
            venue: venue.trim(),
        });
        setCourseCode('');
        setCourseName('');
        setStartTime('');
        setEndTime('');
        setVenue('');
    }

    const daySlots = slotsForDay(selectedDay);
    const selectedDayLabel = DAY_LABELS[DAY_VALUES.indexOf(selectedDay as WeeklyScheduleSlot['dayOfWeek'])];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="size-4" />
                        </span>
                        Weekly Schedule
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-2 flex gap-1">
                    {DAY_LABELS.map((label, index) => {
                        const dayValue = DAY_VALUES[index];
                        const count = slotsForDay(dayValue).length;
                        const isActive = selectedDay === dayValue;

                        return (
                            <button
                                key={label}
                                type="button"
                                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent'
                                }`}
                                onClick={() => setSelectedDay(dayValue)}
                            >
                                {label}
                                {count > 0 && (
                                    <span
                                        className={`flex size-4 items-center justify-center rounded-full text-[10px] font-semibold ${
                                            isActive
                                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {daySlots.length > 0 ? (
                    <div className="mt-4 space-y-2">
                        {daySlots.map((slot) => (
                            <div
                                key={slot.id}
                                className="flex items-start gap-3 rounded-xl border border-l-2 border-border border-l-primary/50 px-4 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold">{slot.courseCode}</span>
                                        {(slot.startTime || slot.endTime) && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock size={10} />
                                                {formatTimeRange(slot.startTime, slot.endTime)}
                                            </span>
                                        )}
                                    </div>
                                    {slot.courseName && (
                                        <p className="text-xs text-muted-foreground">{slot.courseName}</p>
                                    )}
                                    {slot.venue && (
                                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <MapPin size={10} />
                                            {slot.venue}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => onRemoveSlot(slot.id)}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
                        <BookOpen className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No lectures on {selectedDayLabel}.</p>
                    </div>
                )}

                <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Quick Add
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[120px] flex-1 space-y-1.5">
                            <Input
                                value={courseCode}
                                onChange={(e) => handleCourseCodeChange(e.target.value)}
                                placeholder="Course code"
                                className="h-8 text-xs"
                                list={courses ? 'weekly-course-list' : undefined}
                            />
                            {courses && (
                                <datalist id="weekly-course-list">
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
                        <div className="flex items-end gap-1.5">
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-8 w-[88px] text-xs"
                            />
                            <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="h-8 w-[88px] text-xs"
                            />
                        </div>
                        <Input
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            placeholder="Venue"
                            className="h-8 w-24 text-xs"
                        />
                        <Button
                            size="sm"
                            className="h-8 shrink-0 gap-1"
                            disabled={!courseCode.trim() || !startTime}
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
