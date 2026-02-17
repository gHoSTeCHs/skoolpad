import { Head } from '@inertiajs/react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import AdminLayout from '@/layouts/admin-layout';
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
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${department.name}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Department</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update details for {department.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <DepartmentForm department={department} faculty={faculty} />
                </div>
            </div>
        </AdminLayout>
    );
}
