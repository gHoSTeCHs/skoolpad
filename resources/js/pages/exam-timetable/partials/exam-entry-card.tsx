import { router } from '@inertiajs/react';
import { BookOpen, Calendar, CheckCircle2, Clock, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { complete, destroy } from '@/actions/App/Http/Controllers/Student/ExamTimetableController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ExamTimetableEntry } from '@/types/exam-timetable';

interface ExamEntryCardProps {
    entry: ExamTimetableEntry;
    onEdit: (entry: ExamTimetableEntry) => void;
}

function getUrgencyBadge(entry: ExamTimetableEntry): { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' } {
    if (entry.is_completed) {
        return { label: 'Completed', variant: 'secondary' };
    }
    if (entry.is_past) {
        return { label: 'Past', variant: 'secondary' };
    }
    if (entry.is_imminent) {
        return { label: `${entry.days_remaining}d left`, variant: 'destructive' };
    }
    if (entry.is_upcoming) {
        return { label: `${entry.days_remaining}d left`, variant: 'default' };
    }
    return { label: `${entry.days_remaining}d left`, variant: 'outline' };
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ExamEntryCard({ entry, onEdit }: ExamEntryCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const urgency = getUrgencyBadge(entry);

    const displayName = entry.subject_name
        ?? entry.institution_course?.course_title
        ?? entry.level_subject?.subject_name
        ?? 'Unknown';

    function handleComplete() {
        router.post(complete.url(entry.id), {}, { preserveScroll: true });
    }

    function handleDelete() {
        router.delete(destroy.url(entry.id), { preserveScroll: true });
        setConfirmDelete(false);
    }

    return (
        <>
            <div
                className={cn(
                    'rounded-xl border bg-card p-3 transition-colors',
                    entry.is_completed && 'opacity-60',
                )}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-medium', entry.is_completed && 'line-through')}>{entry.label}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            {displayName}
                        </p>
                    </div>
                    <Badge variant={urgency.variant} className="shrink-0 text-[10px]">{urgency.label}</Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(entry.exam_date)}
                    </span>
                    {entry.exam_time && (
                        <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {entry.exam_time}
                        </span>
                    )}
                    {entry.has_aoc && (
                        <span className="flex items-center gap-1">
                            <BookOpen className="size-3" />
                            {entry.aoc_topics.length} AOC
                        </span>
                    )}
                </div>

                {entry.notes && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {entry.notes}
                    </p>
                )}

                <div className="mt-2 flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(entry)}>
                        <Edit2 className="mr-1 size-3" />
                        Edit
                    </Button>
                    {!entry.is_completed && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleComplete}>
                            <CheckCircle2 className="mr-1 size-3" />
                            Complete
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="mr-1 size-3" />
                        Delete
                    </Button>
                </div>
            </div>

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Exam Entry</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{entry.label}&rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
