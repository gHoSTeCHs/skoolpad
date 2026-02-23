import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import FacultyForm from '@/pages/admin/faculties/partials/faculty-form';
import type { Faculty } from '@/types/models';

interface Props {
    faculty: Faculty;
}

export default function AdminFacultiesEdit({ faculty }: Props) {
    const institution = faculty.institution!;

    const breadcrumbs = [
        { title: 'Institutions', href: InstitutionController.index.url() },
        { title: institution.name, href: FacultyController.index.url(institution.id) },
        { title: 'Faculties', href: FacultyController.index.url(institution.id) },
        { title: faculty.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${faculty.name}`}
            description={`Update details for ${faculty.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <FacultyForm faculty={faculty} institution={institution} />
        </FormPageLayout>
    );
}
