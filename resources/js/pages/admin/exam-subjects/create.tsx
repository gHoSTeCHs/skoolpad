import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import ExamSubjectForm from '@/pages/admin/exam-subjects/partials/exam-subject-form';

interface Props {
    examTypes: { id: string; name: string }[];
}

const breadcrumbs = [
    { title: 'Exam Subjects', href: '/admin/exam-subjects' },
    { title: 'Create', href: '/admin/exam-subjects/create' },
];

export default function AdminExamSubjectsCreate({ examTypes }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Exam Subject" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Exam Subject</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new subject to an exam type.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <ExamSubjectForm examTypes={examTypes} />
                </div>
            </div>
        </AdminLayout>
    );
}
