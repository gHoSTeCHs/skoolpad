import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

const breadcrumbs = [
    { title: 'Exam Subjects', href: '/admin/exam-subjects' },
    { title: 'Edit', href: '#' },
];

export default function AdminExamSubjectsEdit() {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Exam Subject" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Exam Subject</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        This page is coming soon.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
