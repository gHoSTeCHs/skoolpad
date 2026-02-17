import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import DisciplineForm from '@/pages/admin/disciplines/partials/discipline-form';
import type { Discipline } from '@/types/models';

interface Props {
    discipline: Discipline;
}

export default function AdminDisciplinesEdit({ discipline }: Props) {
    const breadcrumbs = [
        { title: 'Disciplines', href: '/admin/disciplines' },
        { title: discipline.name, href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${discipline.name}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Discipline</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update details for {discipline.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <DisciplineForm discipline={discipline} />
                </div>
            </div>
        </AdminLayout>
    );
}
