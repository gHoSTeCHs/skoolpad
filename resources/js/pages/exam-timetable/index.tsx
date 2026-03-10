import { Head } from '@inertiajs/react';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { index as timetableIndex } from '@/actions/App/Http/Controllers/Student/ExamTimetableController';
import { CalendarDayCell } from '@/components/skoolpad/calendar/calendar-day-cell';
import { CalendarGrid } from '@/components/skoolpad/calendar/calendar-grid';
import { CalendarHeader } from '@/components/skoolpad/calendar/calendar-header';
import { Button } from '@/components/ui/button';
import { useCalendar, type CalendarDay } from '@/hooks/use-calendar';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { ExamTimetableEntry, ExamTimetablePageProps } from '@/types/exam-timetable';
import { DailyPlanCard } from './partials/daily-plan-card';
import ExamEntryCard from './partials/exam-entry-card';
import ExamEntryModal from './partials/exam-entry-modal';
import { MockPapersSection } from './partials/mock-papers-section';
import { TopicReadiness } from './partials/topic-readiness';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Exam Timetable', href: timetableIndex.url() },
];

function formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getDotColor(entries: ExamTimetableEntry[]): string {
    if (entries.every((e) => e.is_completed)) {
        return 'bg-muted-foreground/40';
    }
    const activeEntries = entries.filter((e) => !e.is_completed);
    if (activeEntries.some((e) => e.is_imminent)) {
        return 'bg-red-500 dark:bg-red-400 reader:bg-red-400';
    }
    if (activeEntries.some((e) => e.is_upcoming)) {
        return 'bg-amber-500 dark:bg-amber-400 reader:bg-amber-400';
    }
    return 'bg-emerald-500 dark:bg-emerald-400 reader:bg-emerald-400';
}

export default function ExamTimetable({ entries, enrolledCourses, enrolledSubjects, assessmentTypes, isSecondary, dailyPlan, examSummary, topicReadiness, mockPapers }: ExamTimetablePageProps) {
    const calendar = useCalendar();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [editingEntry, setEditingEntry] = useState<ExamTimetableEntry | null>(null);

    const entriesByDate = new Map<string, ExamTimetableEntry[]>();
    entries.forEach((entry) => {
        const key = entry.exam_date.split('T')[0];
        if (!entriesByDate.has(key)) {
            entriesByDate.set(key, []);
        }
        entriesByDate.get(key)!.push(entry);
    });

    const activeEntries = entries.filter((e) => !e.is_completed && !e.is_past);
    const pastEntries = entries.filter((e) => e.is_completed || e.is_past);

    function handleDateClick(day: CalendarDay) {
        if (!day.isCurrentMonth) return;
        setEditingEntry(null);
        setSelectedDate(formatDateKey(day.date));
        setModalOpen(true);
    }

    function handleAddExam() {
        setEditingEntry(null);
        setSelectedDate(formatDateKey(new Date()));
        setModalOpen(true);
    }

    function handleEdit(entry: ExamTimetableEntry) {
        setEditingEntry(entry);
        setSelectedDate('');
        setModalOpen(true);
    }

    function renderDay(day: CalendarDay) {
        const dateKey = day.dateKey;
        const dayEntries = entriesByDate.get(dateKey);

        return (
            <CalendarDayCell day={day}>
                {dayEntries && dayEntries.length > 0 && (
                    <div className="mt-0.5 flex items-center gap-0.5">
                        {dayEntries.length <= 3 ? (
                            dayEntries.map((e) => (
                                <span
                                    key={e.id}
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        e.is_completed
                                            ? 'bg-muted-foreground/40'
                                            : e.is_imminent
                                              ? 'bg-red-500 dark:bg-red-400 reader:bg-red-400'
                                              : e.is_upcoming
                                                ? 'bg-amber-500 dark:bg-amber-400 reader:bg-amber-400'
                                                : 'bg-emerald-500 dark:bg-emerald-400 reader:bg-emerald-400',
                                    )}
                                />
                            ))
                        ) : (
                            <>
                                <span className={cn('size-1.5 rounded-full', getDotColor(dayEntries))} />
                                <span className="text-[8px] font-semibold text-muted-foreground">{dayEntries.length}</span>
                            </>
                        )}
                    </div>
                )}
            </CalendarDayCell>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Exam Timetable" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Exam Timetable</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Track your upcoming exams and stay prepared.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                    <div className="rounded-xl border bg-card p-4">
                        <CalendarHeader
                            monthLabel={calendar.monthLabel}
                            isCurrentMonthToday={calendar.isCurrentMonthToday}
                            onPrevMonth={calendar.goToPrevMonth}
                            onNextMonth={calendar.goToNextMonth}
                            onToday={calendar.goToToday}
                        >
                            <Button size="sm" onClick={handleAddExam}>
                                <CalendarPlus className="mr-1.5 size-4" />
                                Add Exam
                            </Button>
                        </CalendarHeader>
                        <div className="mt-4">
                            <CalendarGrid
                                weeks={calendar.weeks}
                                weekDayLabels={calendar.weekDayLabels}
                                renderDay={renderDay}
                                onDateClick={handleDateClick}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {dailyPlan && (
                            <DailyPlanCard dailyPlan={dailyPlan} examSummary={examSummary} />
                        )}

                        <div className="rounded-xl border bg-card p-4">
                            <h3 className="font-display text-sm font-semibold tracking-tight">Upcoming Exams</h3>
                            {activeEntries.length === 0 ? (
                                <p className="mt-3 text-center text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    No upcoming exams. Click a date or &ldquo;Add Exam&rdquo; to get started.
                                </p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {activeEntries.map((entry) => (
                                        <div key={entry.id} className="space-y-2">
                                            <ExamEntryCard entry={entry} onEdit={handleEdit} />
                                            {topicReadiness[entry.id] && topicReadiness[entry.id].length > 0 && (
                                                <TopicReadiness readiness={topicReadiness[entry.id]} entryId={entry.id} />
                                            )}
                                            {mockPapers[entry.id] && mockPapers[entry.id].length > 0 && (
                                                <MockPapersSection papers={mockPapers[entry.id]} entryId={entry.id} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {pastEntries.length > 0 && (
                            <div className="rounded-xl border bg-card p-4">
                                <h3 className="font-display text-sm font-semibold tracking-tight text-muted-foreground">Past Exams</h3>
                                <div className="mt-3 space-y-2">
                                    {pastEntries.map((entry) => (
                                        <ExamEntryCard key={entry.id} entry={entry} onEdit={handleEdit} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ExamEntryModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                entry={editingEntry}
                initialDate={selectedDate}
                enrolledCourses={enrolledCourses}
                enrolledSubjects={enrolledSubjects}
                assessmentTypes={assessmentTypes}
                isSecondary={isSecondary}
            />
        </AppLayout>
    );
}
