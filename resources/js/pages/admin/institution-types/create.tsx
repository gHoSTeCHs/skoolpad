import InstitutionTypeController from '@/actions/App/Http/Controllers/Admin/InstitutionTypeController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import InstitutionTypeForm from '@/pages/admin/institution-types/partials/institution-type-form';

interface Props {
    countries: { id: string; name: string }[];
    gradingScales: { id: string; name: string }[];
}

const breadcrumbs = [
    { title: 'Institution Types', href: InstitutionTypeController.index.url() },
    { title: 'Create', href: '#' },
];

export default function AdminInstitutionTypesCreate({ countries, gradingScales }: Props) {
    return (
        <FormPageLayout
            title="Create Institution Type"
            description="Add a new institution type to the platform."
            breadcrumbs={breadcrumbs}
        >
            <InstitutionTypeForm countries={countries} gradingScales={gradingScales} />
        </FormPageLayout>
    );
}
