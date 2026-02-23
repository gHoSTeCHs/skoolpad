import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
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
        <FormPageLayout
            title={`Edit ${examSubject.name}`}
            description={`Update details for ${examSubject.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <ExamSubjectForm examSubject={examSubject} examType={examType} />
        </FormPageLayout>
    );
}
