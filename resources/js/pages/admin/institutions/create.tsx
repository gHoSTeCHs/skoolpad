import { FormPageLayout } from '@/components/layouts/form-page-layout';
import InstitutionForm from '@/pages/admin/institutions/partials/institution-form';
import type { Country } from '@/types/models';

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    institutionTypes: EnumOption[];
    ownershipTypes: EnumOption[];
    countries: Country[];
}

const breadcrumbs = [
    { title: 'Institutions', href: '/admin/institutions' },
    { title: 'Create', href: '/admin/institutions/create' },
];

export default function AdminInstitutionsCreate({ institutionTypes, ownershipTypes, countries }: Props) {
    return (
        <FormPageLayout
            title="Create Institution"
            description="Add a new institution to the platform."
            breadcrumbs={breadcrumbs}
        >
            <InstitutionForm
                institutionTypes={institutionTypes}
                ownershipTypes={ownershipTypes}
                countries={countries}
            />
        </FormPageLayout>
    );
}
