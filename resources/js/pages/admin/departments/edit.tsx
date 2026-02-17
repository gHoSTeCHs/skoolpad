import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import DepartmentForm from '@/pages/admin/departments/partials/department-form';
import type { Department } from '@/types/models';

interface FacultyWithInstitution {
    id: string;
    name: string;
    institution_id: string;
    institution?: { id: string; name: string };
}

interface Props {
    department: Department;
    faculties: FacultyWithInstitution[];
}

export default function AdminDepartmentsEdit({ department, faculties }: Props) {
    const breadcrumbs = [
        { title: 'Departments', href: '/admin/departments' },
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
                    <DepartmentForm department={department} faculties={faculties} />
                </div>
            </div>
        </AdminLayout>
    );
}
