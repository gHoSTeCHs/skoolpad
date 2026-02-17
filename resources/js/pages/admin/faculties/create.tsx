import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import FacultyForm from '@/pages/admin/faculties/partials/faculty-form';

interface Props {
    institutions: { id: string; name: string; abbreviation?: string }[];
}

const breadcrumbs = [
    { title: 'Faculties', href: '/admin/faculties' },
    { title: 'Create', href: '/admin/faculties/create' },
];

export default function AdminFacultiesCreate({ institutions }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Faculty" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Faculty</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new faculty to an institution.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <FacultyForm institutions={institutions} />
                </div>
            </div>
        </AdminLayout>
    );
}
