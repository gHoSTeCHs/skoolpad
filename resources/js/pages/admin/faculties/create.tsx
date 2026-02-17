import { Head } from '@inertiajs/react';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import AdminLayout from '@/layouts/admin-layout';
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
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Faculty" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Faculty</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new faculty to {institution.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <FacultyForm institution={institution} />
                </div>
            </div>
        </AdminLayout>
    );
}
