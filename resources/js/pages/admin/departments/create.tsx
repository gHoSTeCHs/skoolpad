import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import DepartmentForm from '@/pages/admin/departments/partials/department-form';

interface FacultyWithInstitution {
    id: string;
    name: string;
    institution_id: string;
    institution?: { id: string; name: string };
}

interface Props {
    faculties: FacultyWithInstitution[];
}

const breadcrumbs = [
    { title: 'Departments', href: '/admin/departments' },
    { title: 'Create', href: '/admin/departments/create' },
];

export default function AdminDepartmentsCreate({ faculties }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Department" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Department</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new department to a faculty.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <DepartmentForm faculties={faculties} />
                </div>
            </div>
        </AdminLayout>
    );
}
