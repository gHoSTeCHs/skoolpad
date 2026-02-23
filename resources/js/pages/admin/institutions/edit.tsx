import { FormPageLayout } from '@/components/layouts/form-page-layout';
import InstitutionForm from '@/pages/admin/institutions/partials/institution-form';
import type { Country, Institution } from '@/types/models';

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    institution: Institution;
    institutionTypes: EnumOption[];
    ownershipTypes: EnumOption[];
    countries: Country[];
}

export default function AdminInstitutionsEdit({ institution, institutionTypes, ownershipTypes, countries }: Props) {
    const breadcrumbs = [
        { title: 'Institutions', href: '/admin/institutions' },
        { title: institution.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${institution.name}`}
            description={`Update details for ${institution.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <InstitutionForm
                institution={institution}
                institutionTypes={institutionTypes}
                ownershipTypes={ownershipTypes}
                countries={countries}
            />
        </FormPageLayout>
    );
}
