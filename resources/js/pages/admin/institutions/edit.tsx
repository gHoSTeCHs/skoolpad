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
    institutionTypeModels: { id: string; name: string }[];
    ownershipTypes: EnumOption[];
    countries: Country[];
    gradingScales: { id: string; name: string }[];
}

export default function AdminInstitutionsEdit({ institution, institutionTypes, institutionTypeModels, ownershipTypes, countries, gradingScales }: Props) {
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
                institutionTypeModels={institutionTypeModels}
                ownershipTypes={ownershipTypes}
                countries={countries}
                gradingScales={gradingScales}
            />
        </FormPageLayout>
    );
}
