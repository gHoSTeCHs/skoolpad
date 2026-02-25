import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

export default function QuestionPapersCreate() {
    return (
        <AdminLayout breadcrumbs={[{ title: 'Question Papers', href: '#' }, { title: 'Create', href: '#' }]}>
            <Head title="Create Question Paper" />
            <div className="p-6">
                <h1 className="text-2xl font-bold">Create Question Paper</h1>
            </div>
        </AdminLayout>
    );
}
