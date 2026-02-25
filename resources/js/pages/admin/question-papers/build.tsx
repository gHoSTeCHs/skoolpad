import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

export default function QuestionPapersBuild() {
    return (
        <AdminLayout breadcrumbs={[{ title: 'Question Papers', href: '#' }, { title: 'Build', href: '#' }]}>
            <Head title="Build Question Paper" />
            <div className="p-6">
                <h1 className="text-2xl font-bold">Paper Builder</h1>
            </div>
        </AdminLayout>
    );
}
