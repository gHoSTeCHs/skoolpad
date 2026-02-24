import { FormPageLayout } from '@/components/layouts/form-page-layout';
import EducationSystemForm from '@/pages/admin/education-systems/partials/education-system-form';
import type { Country, EducationSystem } from '@/types/models';

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    educationSystem: EducationSystem;
    systemTypes: EnumOption[];
    countries: Country[];
}

export default function AdminEducationSystemsEdit({ educationSystem, systemTypes, countries }: Props) {
    const breadcrumbs = [
        { title: 'Education Systems', href: '/admin/education-systems' },
        { title: educationSystem.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${educationSystem.name}`}
            description={`Update details for ${educationSystem.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <EducationSystemForm educationSystem={educationSystem} systemTypes={systemTypes} countries={countries} />
        </FormPageLayout>
    );
}
