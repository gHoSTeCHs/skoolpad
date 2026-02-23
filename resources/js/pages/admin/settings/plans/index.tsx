import { Head, Link } from '@inertiajs/react';
import { CreditCard, Info, Pencil } from 'lucide-react';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import SubscriptionPlanController from '@/actions/App/Http/Controllers/Admin/SubscriptionPlanController';
import { PageHeader } from '@/components/admin/page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import type { SubscriptionPlanItem } from '@/types/settings';

interface Props {
    plans: SubscriptionPlanItem[];
    monetizationEnabled: boolean;
}

const breadcrumbs = [
    { title: 'Settings', href: SettingsController.index.url() },
    { title: 'Subscription Plans', href: SubscriptionPlanController.index.url() },
];

export default function AdminPlansIndex({ plans, monetizationEnabled }: Props) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription Plans" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Subscription Plans"
                    description="Manage pricing, features, and billing periods for subscription plans."
                />

                {!monetizationEnabled && (
                    <div className="flex items-start gap-3 rounded-lg border border-[var(--badge-reward-bg)] bg-[var(--badge-reward-bg)]/30 px-4 py-3">
                        <Info className="mt-0.5 size-4 shrink-0 text-[var(--badge-reward-fg)]" />
                        <div>
                            <p className="text-sm font-medium text-[var(--badge-reward-fg)]">Monetization is disabled</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Plans can be configured but billing is not active. Enable monetization in{' '}
                                <Link href={SettingsController.index.url()} className="font-medium underline hover:text-foreground">
                                    Platform Settings
                                </Link>{' '}
                                to activate paid subscriptions.
                            </p>
                        </div>
                    </div>
                )}

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Plan</TableHead>
                                    <TableHead>Display Name</TableHead>
                                    <TableHead className="text-right">Price (NGN)</TableHead>
                                    <TableHead>Billing</TableHead>
                                    <TableHead>Answer Depths</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px] pr-6" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32">
                                            <div className="flex flex-col items-center justify-center gap-2 text-center">
                                                <div className="rounded-lg bg-[var(--badge-neutral-bg)] p-2.5">
                                                    <CreditCard className="size-5 text-[var(--badge-neutral-fg)]" />
                                                </div>
                                                <p className="text-sm font-medium">No subscription plans</p>
                                                <p className="text-sm text-muted-foreground">Seed the database to create default plans.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    plans.map((plan) => (
                                        <TableRow key={plan.id}>
                                            <TableCell className="pl-6">
                                                <span className="font-mono text-xs text-muted-foreground">{plan.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{plan.display_name}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {plan.price_ngn === 0 ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)]"
                                                    >
                                                        Free
                                                    </Badge>
                                                ) : (
                                                    <span className="font-mono text-sm font-semibold tabular-nums">
                                                        ₦{plan.price_formatted}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{plan.billing_period_label}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {plan.features?.answer_depths?.map((depth) => (
                                                        <Badge
                                                            key={depth}
                                                            variant="secondary"
                                                            className="bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)] hover:bg-[var(--badge-neutral-bg)] capitalize"
                                                        >
                                                            {depth.replace('_', ' ')}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge isActive={plan.is_active} />
                                            </TableCell>
                                            <TableCell className="pr-6">
                                                <Button variant="ghost" size="icon" className="size-8" asChild>
                                                    <Link href={SubscriptionPlanController.edit.url(plan.id)}>
                                                        <Pencil className="size-3.5" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
