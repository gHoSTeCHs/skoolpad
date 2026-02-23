import { FormPageLayout } from '@/components/layouts/form-page-layout';
import DisciplineForm from '@/pages/admin/disciplines/partials/discipline-form';
import type { Discipline } from '@/types/models';

interface Props {
    discipline: Discipline;
}

export default function AdminDisciplinesEdit({ discipline }: Props) {
    const breadcrumbs = [
        { title: 'Disciplines', href: '/admin/disciplines' },
        { title: discipline.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${discipline.name}`}
            description={`Update details for ${discipline.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <DisciplineForm discipline={discipline} />
        </FormPageLayout>
    );
}
