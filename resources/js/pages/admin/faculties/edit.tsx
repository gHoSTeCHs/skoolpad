import { Head } from '@inertiajs/react';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import AdminLayout from '@/layouts/admin-layout';
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
                    <FacultyForm faculty={faculty} institution={institution} />
                </div>
            </div>
        </AdminLayout>
    );
}
