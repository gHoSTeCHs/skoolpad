import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import ExamTypeForm from '@/pages/admin/exam-types/partials/exam-type-form';
import type { Country, ExamType } from '@/types/models';

interface Props {
    examType: ExamType;
    countries: Country[];
}

export default function AdminExamTypesEdit({ examType, countries }: Props) {
    const breadcrumbs = [
        { title: 'Exam Types', href: '/admin/exam-types' },
        { title: examType.name, href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${examType.name}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Exam Type</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update details for {examType.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <ExamTypeForm examType={examType} countries={countries} />
                </div>
            </div>
        </AdminLayout>
    );
}
