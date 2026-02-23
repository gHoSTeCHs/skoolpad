import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import SubscriptionPlanController from '@/actions/App/Http/Controllers/Admin/SubscriptionPlanController';
import { FormPageLayout } from '@/components/layouts/form-page-layout';
import { PlanForm } from '@/pages/admin/settings/plans/partials/plan-form';
import type { SubscriptionPlanItem } from '@/types/settings';

interface EnumOption {
    value: string;
    label: string;
}

interface Props {
    plan: SubscriptionPlanItem;
    billingPeriods: EnumOption[];
    answerDepths: EnumOption[];
}

export default function AdminPlanEdit({ plan, billingPeriods, answerDepths }: Props) {
    const breadcrumbs = [
        { title: 'Settings', href: SettingsController.index.url() },
        { title: 'Plans', href: SubscriptionPlanController.index.url() },
        { title: 'Edit', href: '#' },
    ];

    return (
        <FormPageLayout
            title={`Edit ${plan.display_name}`}
            description="Update subscription plan details, pricing, and feature limits."
            breadcrumbs={breadcrumbs}
        >
            <PlanForm plan={plan} billingPeriods={billingPeriods} answerDepths={answerDepths} />
        </FormPageLayout>
    );
}
