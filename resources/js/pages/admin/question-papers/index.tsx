import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

export default function QuestionPapersIndex() {
    return (
        <AdminLayout breadcrumbs={[{ title: 'Question Papers', href: '#' }]}>
            <Head title="Question Papers" />
            <div className="p-6">
                <h1 className="text-2xl font-bold">Question Papers</h1>
                <p className="text-muted-foreground">Manage question papers.</p>
            </div>
        </AdminLayout>
    );
}
