import { Head } from '@inertiajs/react';
import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import AdminLayout from '@/layouts/admin-layout';
import ExamSubjectForm from '@/pages/admin/exam-subjects/partials/exam-subject-form';
import type { ExamSubject } from '@/types/models';

interface Props {
    examSubject: ExamSubject;
}

export default function AdminExamSubjectsEdit({ examSubject }: Props) {
    const examType = examSubject.exam_type!;

    const breadcrumbs = [
        { title: 'Exam Types', href: ExamTypeController.index.url() },
        { title: examType.name, href: ExamSubjectController.index.url(examType.id) },
        { title: examSubject.name, href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${examSubject.name}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Subject</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update details for {examSubject.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <ExamSubjectForm examSubject={examSubject} examType={examType} />
                </div>
            </div>
        </AdminLayout>
    );
}
