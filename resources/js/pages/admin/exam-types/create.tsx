import { FormPageLayout } from '@/components/layouts/form-page-layout';
import ExamTypeForm from '@/pages/admin/exam-types/partials/exam-type-form';
import type { Country } from '@/types/models';

interface Props {
    countries: Country[];
}

const breadcrumbs = [
    { title: 'Exam Types', href: '/admin/exam-types' },
    { title: 'Create', href: '/admin/exam-types/create' },
];

export default function AdminExamTypesCreate({ countries }: Props) {
    return (
        <FormPageLayout
            title="Create Exam Type"
            description="Add a new exam type to the platform."
            breadcrumbs={breadcrumbs}
        >
            <ExamTypeForm countries={countries} />
        </FormPageLayout>
    );
}
