import { FormPageLayout } from '@/components/layouts/form-page-layout';
import DisciplineForm from '@/pages/admin/disciplines/partials/discipline-form';

const breadcrumbs = [
    { title: 'Disciplines', href: '/admin/disciplines' },
    { title: 'Create', href: '/admin/disciplines/create' },
];

export default function AdminDisciplinesCreate() {
    return (
        <FormPageLayout
            title="Create Discipline"
            description="Add a new academic discipline to the platform."
            breadcrumbs={breadcrumbs}
        >
            <DisciplineForm />
        </FormPageLayout>
    );
}
