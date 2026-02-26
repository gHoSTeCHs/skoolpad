import { Head, Link } from '@inertiajs/react';
import CourseCard from '@/components/skoolpad/course-card';
import EmptyState from '@/components/skoolpad/empty-state';
import AppLayout from '@/layouts/app-layout';
import { index as coursesIndex, show as courseShow } from '@/actions/App/Http/Controllers/Student/CourseController';
import type { BreadcrumbItem } from '@/types';
import type { CourseWithProgress } from '@/types/student-courses';

interface Props {
    courses: CourseWithProgress[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Courses', href: coursesIndex.url() },
];

const variants = ['canopy', 'ember', 'honey'] as const;

export default function CoursesIndex({ courses }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Courses" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">
                        My Courses
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {courses.length > 0
                            ? `${courses.length} enrolled course${courses.length !== 1 ? 's' : ''}`
                            : 'No courses enrolled yet'}
                    </p>
                </div>

                {courses.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course, i) => {
                            const progress = course.topics_count > 0
                                ? Math.round((course.completed_topics_count / course.topics_count) * 100)
                                : 0;

                            return (
                                <Link
                                    key={course.id}
                                    href={courseShow.url(course.id)}
                                    className="block"
                                    prefetch
                                >
                                    <CourseCard
                                        code={course.course_code}
                                        name={course.course_title}
                                        progress={progress}
                                        questionCount={course.questions_count}
                                        variant={variants[i % variants.length]}
                                    />
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={'\uD83D\uDCDA'}
                        title="No courses yet"
                        description="Enrol in courses during onboarding to see them here."
                    />
                )}
            </div>
        </AppLayout>
    );
}
