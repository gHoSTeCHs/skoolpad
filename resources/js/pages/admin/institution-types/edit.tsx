import InstitutionTypeController from '@/actions/App/Http/Controllers/Admin/InstitutionTypeController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import InstitutionTypeForm from '@/pages/admin/institution-types/partials/institution-type-form';
import type { InstitutionTypeModel } from '@/types/models';

interface Props {
    institutionType: InstitutionTypeModel;
    countries: { id: string; name: string }[];
    gradingScales: { id: string; name: string }[];
}

export default function AdminInstitutionTypesEdit({ institutionType, countries, gradingScales }: Props) {
    const breadcrumbs = [
        { title: 'Institution Types', href: InstitutionTypeController.index.url() },
        { title: institutionType.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${institutionType.name}`}
            description={`Update details for ${institutionType.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <InstitutionTypeForm
                institutionType={institutionType}
                countries={countries}
                gradingScales={gradingScales}
            />
        </FormPageLayout>
    );
}
