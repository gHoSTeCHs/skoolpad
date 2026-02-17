import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs = [{ title: 'CGPA Simulator', href: '/cgpa-simulator' }];

export default function CgpaSimulator() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CGPA Simulator" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">CGPA Simulator</h1>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        This page is coming soon.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
