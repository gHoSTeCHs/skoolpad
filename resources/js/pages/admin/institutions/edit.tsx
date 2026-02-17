import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import InstitutionForm from '@/pages/admin/institutions/partials/institution-form';
import type { Country, Institution } from '@/types/models';

interface EnumCase {
    value: string;
}

interface Props {
    institution: Institution;
    institutionTypes: EnumCase[];
    ownershipTypes: EnumCase[];
    countries: Country[];
}

export default function AdminInstitutionsEdit({ institution, institutionTypes, ownershipTypes, countries }: Props) {
    const breadcrumbs = [
        { title: 'Institutions', href: '/admin/institutions' },
        { title: institution.name, href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${institution.name}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Institution</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Update details for {institution.name}.
                    </p>
                </div>
                <div className="max-w-2xl">
                    <InstitutionForm
                        institution={institution}
                        institutionTypes={institutionTypes}
                        ownershipTypes={ownershipTypes}
                        countries={countries}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
