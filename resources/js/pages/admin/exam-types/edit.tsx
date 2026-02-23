import { FormPageLayout } from '@/components/layouts/form-page-layout';
import ExamTypeForm from '@/pages/admin/exam-types/partials/exam-type-form';
import type { Country, ExamType } from '@/types/models';

interface Props {
    examType: ExamType;
    countries: Country[];
}

export default function AdminExamTypesEdit({ examType, countries }: Props) {
    const breadcrumbs = [
        { title: 'Exam Types', href: '/admin/exam-types' },
        { title: examType.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${examType.name}`}
            description={`Update details for ${examType.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <ExamTypeForm examType={examType} countries={countries} />
        </FormPageLayout>
    );
}
