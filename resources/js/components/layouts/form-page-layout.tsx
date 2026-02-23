import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

interface Breadcrumb {
    title: string;
    href: string;
}

interface FormPageLayoutProps {
    title: string;
    description: string;
    breadcrumbs: Breadcrumb[];
    children: React.ReactNode;
    maxWidth?: string;
}

export function FormPageLayout({ title, description, breadcrumbs, children, maxWidth = 'max-w-2xl' }: FormPageLayoutProps) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <div className={maxWidth}>{children}</div>
            </div>
        </AdminLayout>
    );
}
