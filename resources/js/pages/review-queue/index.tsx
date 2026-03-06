import { Head, router } from '@inertiajs/react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import ReviewQueueController from '@/actions/App/Http/Controllers/Student/ReviewQueueController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { ReviewQueuePageProps } from '@/types/student-review-queue';
import QueueItem from './partials/queue-item';
import ReviewCalendar from './partials/review-calendar';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Review Queue', href: ReviewQueueController.index.url() },
];

function getDueCountColor(count: number): string {
    if (count === 0) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400 reader:border-emerald-800/50 reader:bg-emerald-950/40 reader:text-emerald-400';
    if (count <= 10) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-400 reader:border-amber-800/50 reader:bg-amber-950/40 reader:text-amber-400';
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400 reader:border-red-800/50 reader:bg-red-950/40 reader:text-red-400';
}

export default function ReviewQueue({ dueCount, dueItems, enrolledCourses, selectedCourseId, calendar }: ReviewQueuePageProps) {
    function handleCourseFilter(value: string) {
        const courseParam = value === 'all' ? undefined : value;
        router.get(ReviewQueueController.index.url(), { course: courseParam }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function handleStartReview() {
        router.post(ReviewQueueController.start.url(), {
            course_id: selectedCourseId ?? undefined,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Review Queue" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-2xl font-bold tracking-tight">Review Queue</h1>
                            <Badge variant="outline" className={cn('tabular-nums', getDueCountColor(dueCount))}>
                                {dueCount} due
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Strengthen your memory with spaced repetition.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {enrolledCourses.length > 1 && (
                            <Select value={selectedCourseId ?? 'all'} onValueChange={handleCourseFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {enrolledCourses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.course_code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {dueItems.length > 0 && (
                            <Button onClick={handleStartReview}>
                                <RotateCcw className="mr-1.5 size-4" />
                                Start Review
                            </Button>
                        )}
                    </div>
                </div>

                {dueItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 py-16 dark:border-emerald-800/30 dark:bg-emerald-950/10 reader:border-emerald-800/30 reader:bg-emerald-950/10">
                        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 reader:bg-emerald-900/40">
                            <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400 reader:text-emerald-400" />
                        </div>
                        <h3 className="font-display mt-4 text-lg font-semibold">All caught up!</h3>
                        <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            No items due for review right now. Keep practising and new reviews will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="space-y-2 lg:col-span-2">
                            {dueItems.map((item) => (
                                <QueueItem key={item.id} item={item} />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <ReviewCalendar calendar={calendar} />
                        </div>
                    </div>
                )}

                {dueItems.length === 0 && (
                    <ReviewCalendar calendar={calendar} />
                )}
            </div>
        </AppLayout>
    );
}
