import { Head } from '@inertiajs/react';
import CourseCard from '@/components/skoolpad/course-card';
import StatCard from '@/components/skoolpad/stat-card';
import StreakWidget from '@/components/skoolpad/streak-widget';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface DashboardCourse {
    id: string;
    course_code: string;
    course_title: string;
    topic_count: number;
    question_count: number;
}

interface SuggestedTopic {
    id: string;
    title: string;
    slug: string;
}

interface Props {
    student: {
        name: string;
        institution: string;
        faculty: string;
        department: string;
        level: number;
    } | null;
    courses: DashboardCourse[];
    stats: {
        courses_count: number;
        practice_sessions: number;
        study_hours: number;
        streak_days: number;
    };
    suggested_topics: SuggestedTopic[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

const variants = ['canopy', 'ember', 'honey'] as const;

const streakDays = [
    { label: 'M', state: 'upcoming' as const },
    { label: 'T', state: 'upcoming' as const },
    { label: 'W', state: 'upcoming' as const },
    { label: 'T', state: 'upcoming' as const },
    { label: 'F', state: 'upcoming' as const },
    { label: 'S', state: 'upcoming' as const },
    { label: 'S', state: 'upcoming' as const },
];

export default function Dashboard({ student, courses, stats, suggested_topics }: Props) {
    const firstName = student?.name.split(' ')[0] ?? 'Student';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-8 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        Welcome back, {firstName}!
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {student
                            ? `${student.department} · ${student.level} Level · ${student.institution}`
                            : "Here's your learning progress"}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Courses"
                        value={String(stats.courses_count)}
                        change={stats.courses_count === 0 ? 'Enrol to start' : `${stats.courses_count} enrolled`}
                        trend={stats.courses_count > 0 ? 'up' : 'neutral'}
                    />
                    <StatCard
                        label="Practice"
                        value={String(stats.practice_sessions)}
                        change="Coming soon"
                        trend="neutral"
                    />
                    <StatCard
                        label="Hours"
                        value={String(stats.study_hours)}
                        change="Coming soon"
                        trend="neutral"
                    />
                    <StreakWidget count={stats.streak_days} days={streakDays} />
                </div>

                {courses.length > 0 && (
                    <div>
                        <h2 className="font-display text-lg font-semibold tracking-tight">
                            Your Courses
                        </h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course, i) => (
                                <CourseCard
                                    key={course.id}
                                    code={course.course_code}
                                    name={course.course_title}
                                    progress={0}
                                    questionCount={course.question_count}
                                    variant={variants[i % variants.length]}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {suggested_topics.length > 0 && (
                    <div>
                        <h2 className="font-display text-lg font-semibold tracking-tight">
                            Suggested Topics
                        </h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {suggested_topics.map((topic) => (
                                <div
                                    key={topic.id}
                                    className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                                >
                                    <span className="text-sm font-medium">{topic.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {courses.length === 0 && (
                    <div className="rounded-lg border border-dashed bg-card/50 p-8 text-center">
                        <h3 className="font-display text-lg font-semibold">No courses yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your enrolled courses will appear here once you complete onboarding.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
