import { Head } from '@inertiajs/react';

export default function ChildDashboard() {
    return (
        <>
            <Head title="Child Dashboard" />
            <div className="flex min-h-screen items-center justify-center">
                <h1 className="text-2xl font-bold text-foreground">Child Dashboard</h1>
            </div>
        </>
    );
}
