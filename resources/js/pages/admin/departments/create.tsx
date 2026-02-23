import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import DepartmentForm from '@/pages/admin/departments/partials/department-form';

interface FacultyWithInstitution {
    id: string;
    name: string;
    abbreviation: string | null;
    institution: { id: string; name: string; abbreviation: string } | null;
}

interface Props {
    faculty: FacultyWithInstitution;
}

export default function AdminDepartmentsCreate({ faculty }: Props) {
    const institution = faculty.institution!;

    const breadcrumbs = [
        { title: 'Institutions', href: InstitutionController.index.url() },
        { title: institution.name, href: FacultyController.index.url(institution.id) },
        { title: faculty.name, href: DepartmentController.index.url(faculty.id) },
        { title: 'Create', href: '#' },
    ];

    return (
        <FormPageLayout
            title="Create Department"
            description={`Add a new department to ${faculty.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <DepartmentForm faculty={faculty} />
        </FormPageLayout>
    );
}
