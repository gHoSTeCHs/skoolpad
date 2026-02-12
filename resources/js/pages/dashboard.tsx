import { Head, usePage } from '@inertiajs/react';
import CourseCard from '@/components/skoolpad/course-card';
import StatCard from '@/components/skoolpad/stat-card';
import StreakWidget from '@/components/skoolpad/streak-widget';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const streakDays = [
    { label: 'M', state: 'completed' as const },
    { label: 'T', state: 'completed' as const },
    { label: 'W', state: 'completed' as const },
    { label: 'T', state: 'completed' as const },
    { label: 'F', state: 'completed' as const },
    { label: 'S', state: 'today' as const },
    { label: 'S', state: 'upcoming' as const },
];

const courses = [
    { code: 'MATH 101', name: 'Further Mathematics', progress: 75, questionCount: 320, variant: 'canopy' as const },
    { code: 'ENG 201', name: 'English Language', progress: 45, questionCount: 280, variant: 'ember' as const },
    { code: 'PHY 301', name: 'Physics', progress: 20, questionCount: 410, variant: 'honey' as const },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-8 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        Welcome back, {firstName}!
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Here&apos;s your learning progress
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Courses" value="8" change="+2 this week" trend="up" />
                    <StatCard label="Practice" value="42" change="+12 this week" trend="up" />
                    <StatCard label="Hours" value="28" change="Same as last week" trend="neutral" />
                    <StreakWidget count={7} days={streakDays} />
                </div>

                <div>
                    <h2 className="font-display text-lg font-semibold tracking-tight">
                        Continue Learning
                    </h2>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard key={course.code} {...course} />
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
