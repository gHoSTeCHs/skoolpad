import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import DepartmentForm from '@/pages/admin/departments/partials/department-form';
import type { Department } from '@/types/models';

interface Props {
    department: Department;
}

export default function AdminDepartmentsEdit({ department }: Props) {
    const faculty = department.faculty!;
    const institution = faculty.institution!;

    const breadcrumbs = [
        { title: 'Institutions', href: InstitutionController.index.url() },
        { title: institution.name, href: FacultyController.index.url(institution.id) },
        { title: faculty.name, href: DepartmentController.index.url(faculty.id) },
        { title: department.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${department.name}`}
            description={`Update details for ${department.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <DepartmentForm department={department} faculty={faculty} />
        </FormPageLayout>
    );
}
