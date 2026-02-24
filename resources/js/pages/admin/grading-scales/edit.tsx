import { FormPageLayout } from '@/components/layouts/form-page-layout';
import GradingScaleForm from '@/pages/admin/grading-scales/partials/grading-scale-form';
import type { GradingScale } from '@/types/models';

interface Props {
    gradingScale: GradingScale;
    scaleTypes: { value: string; label: string }[];
}

export default function AdminGradingScalesEdit({ gradingScale, scaleTypes }: Props) {
    const breadcrumbs = [
        { title: 'Grading Scales', href: '/admin/grading-scales' },
        { title: gradingScale.name, href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${gradingScale.name}`}
            description={`Update details for ${gradingScale.name}.`}
            breadcrumbs={breadcrumbs}
        >
            <GradingScaleForm gradingScale={gradingScale} scaleTypes={scaleTypes} />
        </FormPageLayout>
    );
}
