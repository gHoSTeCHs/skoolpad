import { FormPageLayout } from '@/components/layouts/form-page-layout';
import GradingScaleForm from '@/pages/admin/grading-scales/partials/grading-scale-form';

interface Props {
    scaleTypes: { value: string; label: string }[];
}

const breadcrumbs = [
    { title: 'Grading Scales', href: '/admin/grading-scales' },
    { title: 'Create', href: '/admin/grading-scales/create' },
];

export default function AdminGradingScalesCreate({ scaleTypes }: Props) {
    return (
        <FormPageLayout
            title="Create Grading Scale"
            description="Add a new grading scale to the platform."
            breadcrumbs={breadcrumbs}
        >
            <GradingScaleForm scaleTypes={scaleTypes} />
        </FormPageLayout>
    );
}
