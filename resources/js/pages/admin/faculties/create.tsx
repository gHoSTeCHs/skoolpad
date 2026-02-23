import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import FacultyForm from '@/pages/admin/faculties/partials/faculty-form';

interface Props {
    institution: { id: string; name: string; abbreviation: string };
}

export default function AdminFacultiesCreate({ institution }: Props) {
    const breadcrumbs = [
        { title: 'Institutions', href: InstitutionController.index.url() },
        { title: institution.name, href: FacultyController.index.url(institution.id) },
        { title: 'Faculties', href: FacultyController.index.url(institution.id) },
        { title: 'Create', href: '#' },
    ];

    return (
        <FormPageLayout
            title="Create Faculty"
            description={`Add a new faculty to ${institution.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <FacultyForm institution={institution} />
        </FormPageLayout>
    );
}
