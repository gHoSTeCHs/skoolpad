import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import DisciplineForm from '@/pages/admin/disciplines/partials/discipline-form';

const breadcrumbs = [
    { title: 'Disciplines', href: '/admin/disciplines' },
    { title: 'Create', href: '/admin/disciplines/create' },
];

export default function AdminDisciplinesCreate() {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Discipline" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Discipline</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new academic discipline to the platform.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <DisciplineForm />
                </div>
            </div>
        </AdminLayout>
    );
}
