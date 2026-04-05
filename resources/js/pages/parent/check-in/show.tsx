import { Head, router } from '@inertiajs/react';
import { CheckCircle2, ClipboardCheck, Clock } from 'lucide-react';
import { useState } from 'react';
import { complete } from '@/actions/App/Http/Controllers/ParentDashboard/CheckInController';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/ParentDashboard/ParentDashboardController';
import { CheckInTopicItem } from '@/components/parent/check-in-topic-item';
import { CoverageQuestion } from '@/components/parent/coverage-question';
import ParentLayout from '@/layouts/parent-layout';
import type { CheckInSession } from '@/types/parent';

interface CheckInShowProps {
    child: { id: string; name: string };
    checkIn: CheckInSession;
}

export default function CheckInShow({ child, checkIn }: CheckInShowProps) {
    const [answeredCoverage, setAnsweredCoverage] = useState<Set<string>>(new Set());
    const [completing, setCompleting] = useState(false);

    const schemeItems = checkIn.items.filter((i) => i.type === 'scheme_alignment');
    const topicItems = checkIn.items.filter((i) => i.type !== 'scheme_alignment');
    const totalMinutes = checkIn.items.reduce((sum, i) => sum + (i.estimated_minutes ?? 0), 0);
    const isCompleted = checkIn.status === 'completed';

    const completedTopicIds = new Set(
        (checkIn.completed_items ?? []).map((ci) => ci.canonical_topic_id),
    );

    function handleCoverageRespond(topicId: string) {
        setAnsweredCoverage((prev) => new Set([...prev, topicId]));
    }

    function handleComplete() {
        setCompleting(true);
        router.post(
            complete.url(child.id),
            {
                completed_items: checkIn.items.map((item) => ({
                    canonical_topic_id: item.canonical_topic_id,
                    type: item.type,
                    completed: true,
                })),
            },
            {
                onFinish: () => setCompleting(false),
            },
        );
    }

    const pendingCoverage = schemeItems.filter((i) => !answeredCoverage.has(i.canonical_topic_id));

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: dashboardIndex.url() },
            { title: 'Check-in', href: '#' },
        ]}>
            <Head title={`Check-in — ${child.name}`} />

            <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        {isCompleted ? 'Check-in Complete' : "Tonight's Check-in"}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>{child.name}</span>
                        <span className="text-border">|</span>
                        <span>{checkIn.session_date}</span>
                        <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            ~{totalMinutes} min
                        </span>
                    </div>
                </div>

                {isCompleted ? (
                    <div className="rounded-xl border border-[var(--canopy-200)] bg-[var(--canopy-50)] p-8 text-center dark:border-[var(--canopy-800)] dark:bg-[var(--canopy-950)]">
                        <CheckCircle2 className="mx-auto size-10 text-[var(--canopy-600)]" />
                        <p className="mt-3 font-display text-lg font-bold text-foreground">Well done!</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            You completed {checkIn.completed_items?.length ?? 0} items tonight.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Phase 1: Coverage Questions */}
                        {pendingCoverage.length > 0 && (
                            <section>
                                <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <ClipboardCheck className="size-3.5" />
                                    Coverage Check ({pendingCoverage.length} remaining)
                                </h2>
                                <div className="space-y-3">
                                    {pendingCoverage.map((item) => (
                                        <CoverageQuestion
                                            key={item.canonical_topic_id}
                                            topicTitle={item.topic_title}
                                            weekNumber={item.week_number}
                                            childId={child.id}
                                            topicId={item.canonical_topic_id}
                                            onRespond={() => handleCoverageRespond(item.canonical_topic_id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Phase 2: Topic Items */}
                        {topicItems.length > 0 && (
                            <section>
                                <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <ClipboardCheck className="size-3.5" />
                                    Topics to Review ({topicItems.length})
                                </h2>
                                <div className="space-y-2">
                                    {topicItems.map((item) => (
                                        <CheckInTopicItem
                                            key={item.canonical_topic_id}
                                            item={item}
                                            childId={child.id}
                                            isCompleted={completedTopicIds.has(item.canonical_topic_id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {checkIn.items.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    No items in tonight's session. Check back tomorrow!
                                </p>
                            </div>
                        )}

                        {/* Complete Button */}
                        {checkIn.items.length > 0 && (
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleComplete}
                                    disabled={completing}
                                    className="w-full rounded-lg bg-[var(--canopy-600)] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50 sm:w-auto sm:px-8"
                                >
                                    {completing ? 'Completing...' : 'Complete Check-in'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ParentLayout>
    );
}
