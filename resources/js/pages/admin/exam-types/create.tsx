import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import ExamTypeForm from '@/pages/admin/exam-types/partials/exam-type-form';
import type { Country } from '@/types/models';

interface Props {
    countries: Country[];
}

const breadcrumbs = [
    { title: 'Exam Types', href: '/admin/exam-types' },
    { title: 'Create', href: '/admin/exam-types/create' },
];

export default function AdminExamTypesCreate({ countries }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Exam Type" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Exam Type</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new exam type to the platform.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <ExamTypeForm countries={countries} />
                </div>
            </div>
        </AdminLayout>
    );
}
