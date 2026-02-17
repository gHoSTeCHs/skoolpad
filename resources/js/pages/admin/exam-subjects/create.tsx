import { Head } from '@inertiajs/react';
import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import AdminLayout from '@/layouts/admin-layout';
import ExamSubjectForm from '@/pages/admin/exam-subjects/partials/exam-subject-form';

interface Props {
    examType: { id: string; name: string; slug: string };
}

export default function AdminExamSubjectsCreate({ examType }: Props) {
    const breadcrumbs = [
        { title: 'Exam Types', href: ExamTypeController.index.url() },
        { title: examType.name, href: ExamSubjectController.index.url(examType.id) },
        { title: 'Create', href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Exam Subject" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Subject</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new subject to {examType.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <ExamSubjectForm examType={examType} />
                </div>
            </div>
        </AdminLayout>
    );
}
