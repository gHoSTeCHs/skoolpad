import { Head, Link, router } from '@inertiajs/react';
import { Banknote, CreditCard, Info, UserPlus } from 'lucide-react';
import { useState } from 'react';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import SubscriptionPlanController from '@/actions/App/Http/Controllers/Admin/SubscriptionPlanController';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';
import type { PlatformSettings } from '@/types/settings';

interface Props {
    settings: PlatformSettings;
}

const breadcrumbs = [{ title: 'Settings', href: SettingsController.index.url() }];

function SettingToggle({
    icon: Icon,
    title,
    description,
    settingKey,
    checked,
    iconBg,
    iconFg,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    settingKey: string;
    checked: boolean;
    iconBg: string;
    iconFg: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleToggle(value: boolean) {
        setIsSubmitting(true);
        router.put(
            SettingsController.update.url(),
            { key: settingKey, value },
            {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    }

    return (
        <Card className={checked ? 'border-[var(--canopy-400)]/20' : ''}>
            <CardContent className="flex items-start gap-4 pt-6">
                <div className={`shrink-0 rounded-lg p-2.5 ${iconBg}`}>
                    <Icon className={`size-5 ${iconFg}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="font-display text-base font-semibold tracking-tight">{title}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                        </div>
                        <Switch
                            checked={checked}
                            onCheckedChange={handleToggle}
                            disabled={isSubmitting}
                            className="shrink-0"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminSettings({ settings }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Platform Settings"
                    description="Configure platform-wide settings and preferences."
                    action={{ label: 'Subscription Plans', href: SubscriptionPlanController.index.url() }}
                />

                <div className="max-w-2xl space-y-4">
                    <SettingToggle
                        icon={Banknote}
                        title="Monetization"
                        description="Enable paid subscription plans and payment processing. When disabled, all users have free access to platform features."
                        settingKey="monetization_enabled"
                        checked={Boolean(settings.monetization_enabled)}
                        iconBg="bg-[var(--badge-reward-bg)]"
                        iconFg="text-[var(--badge-reward-fg)]"
                    />

                    <SettingToggle
                        icon={UserPlus}
                        title="Registration"
                        description="Allow new users to create accounts on the platform. When disabled, only existing users can log in."
                        settingKey="registration_open"
                        checked={Boolean(settings.registration_open)}
                        iconBg="bg-[var(--badge-primary-bg)]"
                        iconFg="text-[var(--badge-primary-fg)]"
                    />

                    <div className="flex items-start gap-3 rounded-lg border border-[var(--badge-reward-bg)] bg-[var(--badge-reward-bg)]/30 px-4 py-3">
                        <Info className="mt-0.5 size-4 shrink-0 text-[var(--badge-reward-fg)]" />
                        <div>
                            <p className="text-sm font-medium text-[var(--badge-reward-fg)]">Phase 1 Note</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Payment processing (Paystack integration) will be available in Phase 2. Subscription plans can be configured now but billing is not yet active.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
