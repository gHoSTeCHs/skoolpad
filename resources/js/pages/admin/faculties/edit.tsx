import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import FacultyForm from '@/pages/admin/faculties/partials/faculty-form';
import type { Faculty } from '@/types/models';

interface Props {
    faculty: Faculty;
    institutions: { id: string; name: string; abbreviation?: string }[];
}

export default function AdminFacultiesEdit({ faculty, institutions }: Props) {
    const breadcrumbs = [
        { title: 'Faculties', href: '/admin/faculties' },
        { title: faculty.name, href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${faculty.name}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Faculty</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update details for {faculty.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <FacultyForm faculty={faculty} institutions={institutions} />
                </div>
            </div>
        </AdminLayout>
    );
}
