import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
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
        <FormPageLayout
            title="Create Subject"
            description={`Add a new subject to ${examType.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <ExamSubjectForm examType={examType} />
        </FormPageLayout>
    );
}
