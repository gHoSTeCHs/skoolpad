import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import ExamSubjectForm from '@/pages/admin/exam-subjects/partials/exam-subject-form';
import type { ExamSubject } from '@/types/models';

interface Props {
    examSubject: ExamSubject;
    examTypes: { id: string; name: string }[];
}

export default function AdminExamSubjectsEdit({ examSubject, examTypes }: Props) {
    const breadcrumbs = [
        { title: 'Exam Subjects', href: '/admin/exam-subjects' },
        { title: examSubject.name, href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${examSubject.name}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Exam Subject</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update details for {examSubject.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <ExamSubjectForm examSubject={examSubject} examTypes={examTypes} />
                </div>
            </div>
        </AdminLayout>
    );
}
