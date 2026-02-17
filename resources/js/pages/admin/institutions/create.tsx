import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import InstitutionForm from '@/pages/admin/institutions/partials/institution-form';
import type { Country } from '@/types/models';

interface EnumCase {
    value: string;
}

interface Props {
    institutionTypes: EnumCase[];
    ownershipTypes: EnumCase[];
    countries: Country[];
}

const breadcrumbs = [
    { title: 'Institutions', href: '/admin/institutions' },
    { title: 'Create', href: '/admin/institutions/create' },
];

export default function AdminInstitutionsCreate({ institutionTypes, ownershipTypes, countries }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Institution" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Institution</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new institution to the platform.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <InstitutionForm
                        institutionTypes={institutionTypes}
                        ownershipTypes={ownershipTypes}
                        countries={countries}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
