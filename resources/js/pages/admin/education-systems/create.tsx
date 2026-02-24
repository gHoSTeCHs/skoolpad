import { FormPageLayout } from '@/components/layouts/form-page-layout';
import EducationSystemForm from '@/pages/admin/education-systems/partials/education-system-form';
import type { Country } from '@/types/models';

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    systemTypes: EnumOption[];
    countries: Country[];
}

const breadcrumbs = [
    { title: 'Education Systems', href: '/admin/education-systems' },
    { title: 'Create', href: '/admin/education-systems/create' },
];

export default function AdminEducationSystemsCreate({ systemTypes, countries }: Props) {
    return (
        <FormPageLayout
            title="Create Education System"
            description="Add a new education system to the platform."
            breadcrumbs={breadcrumbs}
        >
            <EducationSystemForm systemTypes={systemTypes} countries={countries} />
        </FormPageLayout>
    );
}
