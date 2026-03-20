import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { ChildSelector } from '@/components/parent/child-selector';
import { CheckInCta } from '@/components/parent/check-in-cta';
import { DailyActivityCard } from '@/components/parent/daily-activity-card';
import { ReadinessCard } from '@/components/parent/readiness-card';
import { StalenessIndicator } from '@/components/parent/staleness-indicator';
import { StreakCard } from '@/components/parent/streak-card';
import { SubjectStrengthCard } from '@/components/parent/subject-strength-card';
import { WeeklySummaryCard } from '@/components/parent/weekly-summary-card';
import ParentLayout from '@/layouts/parent-layout';
import type {
    CheckInSession,
    ChildDailyActivity,
    ExamReadiness,
    LinkedChild,
    StreakData,
    SubjectStrength,
    WeeklySummary,
} from '@/types/parent';

interface ParentDashboardProps {
    children: LinkedChild[];
    subscription_status: string;
    check_in: CheckInSession | null;
    readiness_scores: ExamReadiness[];
    subject_strengths: SubjectStrength[];
    weekly_summary: WeeklySummary | null;
    streak: StreakData | null;
    daily_activity: ChildDailyActivity | null;
}

export default function ParentDashboard({
    children,
    subscription_status,
    check_in,
    readiness_scores,
    subject_strengths,
    weekly_summary,
    streak,
    daily_activity,
}: ParentDashboardProps) {
    const [selectedChildId, setSelectedChildId] = useState<string | null>(
        children[0]?.student_profile_id ?? null,
    );

    const selectedChild = children.find((c) => c.student_profile_id === selectedChildId) ?? children[0];
    const childFirstName = selectedChild?.student_profile?.user?.name?.split(' ')[0] || 'Your child';
    const lastCheckInDate = check_in?.completed_at ?? null;

    return (
        <ParentLayout breadcrumbs={[{ title: 'Dashboard', href: '/parent/dashboard' }]}>
            <Head title="Parent Dashboard" />

            <div className="flex flex-col gap-6 p-4 md:gap-8 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                            {childFirstName}&apos;s Dashboard
                        </h1>
                        <div className="mt-1 flex items-center gap-2">
                            {subscription_status !== 'free' && (
                                <span className="inline-block rounded-full bg-[var(--canopy-100)] px-2.5 py-0.5 text-xs font-medium text-[var(--canopy-700)] dark:bg-[var(--canopy-900)] dark:text-[var(--canopy-300)]">
                                    {subscription_status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                </span>
                            )}
                        </div>
                    </div>
                    <ChildSelector
                        children={children}
                        selectedChildId={selectedChildId}
                        onSelect={setSelectedChildId}
                    />
                </div>

                {children.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                        <p className="text-lg font-semibold text-foreground">No children linked yet</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Add a child or link to an existing student to get started.
                        </p>
                    </div>
                ) : (
                    <>
                        <StalenessIndicator lastCheckInDate={lastCheckInDate} />

                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <CheckInCta
                                    checkIn={check_in}
                                    childId={selectedChild?.student_profile_id ?? ''}
                                />
                            </div>

                            <DailyActivityCard
                                activity={daily_activity}
                                childName={childFirstName}
                            />
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="sm:col-span-2 lg:col-span-2">
                                <ReadinessCard scores={readiness_scores} />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-2">
                                <SubjectStrengthCard subjects={subject_strengths} />
                            </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <WeeklySummaryCard summary={weekly_summary} />
                            </div>
                            <StreakCard streak={streak} />
                        </div>
                    </>
                )}
            </div>
        </ParentLayout>
    );
}
