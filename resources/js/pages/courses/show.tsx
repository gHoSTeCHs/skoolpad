import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function CourseShow({ course }: { course: string }) {
    const breadcrumbs = [
        { title: 'Courses', href: '/courses' },
        { title: course, href: `/courses/${course}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Course: ${course}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Course: {course}</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        This page is coming soon.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
