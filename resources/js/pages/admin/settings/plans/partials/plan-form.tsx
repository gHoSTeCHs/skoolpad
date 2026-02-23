import { useForm } from '@inertiajs/react';
import SubscriptionPlanController from '@/actions/App/Http/Controllers/Admin/SubscriptionPlanController';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

export function PlanForm({ plan, billingPeriods, answerDepths }: Props) {
    const form = useForm({
        display_name: plan.display_name,
        price_ngn: plan.price_ngn,
        billing_period: plan.billing_period,
        features: {
            daily_ocr: plan.features.daily_ocr,
            daily_ai_messages: plan.features.daily_ai_messages,
            daily_gradings: plan.features.daily_gradings,
            answer_depths: plan.features.answer_depths,
        },
        is_active: plan.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(SubscriptionPlanController.update.url(plan.id));
    }

    function handleAnswerDepthToggle(depth: string, checked: boolean) {
        const current = form.data.features.answer_depths;
        const updated = checked
            ? [...current, depth]
            : current.filter((d) => d !== depth);
        form.setData('features', { ...form.data.features, answer_depths: updated });
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={SubscriptionPlanController.index.url()}
            submitLabel="Update Plan"
            isSubmitting={form.processing}
        >
            <div className="space-y-1">
                <p className="text-sm font-medium">Internal Name</p>
                <p className="text-sm text-muted-foreground font-mono">{plan.name}</p>
            </div>

            <FormField label="Display Name" name="display_name" error={form.errors.display_name} required>
                <Input
                    id="display_name"
                    value={form.data.display_name}
                    onChange={(e) => form.setData('display_name', e.target.value)}
                    placeholder="e.g. Scholar Pro"
                />
            </FormField>

            <FormField
                label="Price (kobo)"
                name="price_ngn"
                error={form.errors.price_ngn}
                description="Price in kobo (100 kobo = ₦1). Set to 0 for free plans."
                required
            >
                <Input
                    id="price_ngn"
                    type="number"
                    min={0}
                    value={form.data.price_ngn}
                    onChange={(e) => form.setData('price_ngn', parseInt(e.target.value) || 0)}
                />
            </FormField>

            <FormField label="Billing Period" name="billing_period" error={form.errors.billing_period} required>
                <Select
                    value={form.data.billing_period}
                    onValueChange={(value) => form.setData('billing_period', value)}
                >
                    <SelectTrigger id="billing_period">
                        <SelectValue placeholder="Select billing period" />
                    </SelectTrigger>
                    <SelectContent>
                        {billingPeriods.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                                {period.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div>
                    <p className="font-display text-sm font-semibold tracking-tight">Daily Limits</p>
                    <p className="text-xs text-muted-foreground">Set daily usage limits. Use -1 for unlimited.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField label="OCR Scans" name="features.daily_ocr" error={form.errors['features.daily_ocr']}>
                        <Input
                            id="features.daily_ocr"
                            type="number"
                            min={-1}
                            value={form.data.features.daily_ocr}
                            onChange={(e) =>
                                form.setData('features', {
                                    ...form.data.features,
                                    daily_ocr: parseInt(e.target.value) || 0,
                                })
                            }
                        />
                    </FormField>

                    <FormField label="AI Messages" name="features.daily_ai_messages" error={form.errors['features.daily_ai_messages']}>
                        <Input
                            id="features.daily_ai_messages"
                            type="number"
                            min={-1}
                            value={form.data.features.daily_ai_messages}
                            onChange={(e) =>
                                form.setData('features', {
                                    ...form.data.features,
                                    daily_ai_messages: parseInt(e.target.value) || 0,
                                })
                            }
                        />
                    </FormField>

                    <FormField label="Gradings" name="features.daily_gradings" error={form.errors['features.daily_gradings']}>
                        <Input
                            id="features.daily_gradings"
                            type="number"
                            min={-1}
                            value={form.data.features.daily_gradings}
                            onChange={(e) =>
                                form.setData('features', {
                                    ...form.data.features,
                                    daily_gradings: parseInt(e.target.value) || 0,
                                })
                            }
                        />
                    </FormField>
                </div>
            </div>

            <FormField
                label="Answer Depths"
                name="features.answer_depths"
                error={form.errors['features.answer_depths']}
                description="Select which answer depth levels are included in this plan."
                required
            >
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                    {answerDepths.map((depth) => (
                        <label
                            key={depth.value}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent"
                        >
                            <Checkbox
                                checked={form.data.features.answer_depths.includes(depth.value)}
                                onCheckedChange={(checked) => handleAnswerDepthToggle(depth.value, Boolean(checked))}
                            />
                            <span className="text-sm font-medium">{depth.label}</span>
                        </label>
                    ))}
                </div>
            </FormField>

            <FormField label="Active" name="is_active" error={form.errors.is_active}>
                <div className="flex items-center gap-3 pt-1">
                    <Switch
                        id="is_active"
                        checked={form.data.is_active}
                        onCheckedChange={(checked) => form.setData('is_active', checked)}
                    />
                    <Label htmlFor="is_active" className="font-normal">
                        {form.data.is_active ? 'Plan is active and visible to users' : 'Plan is inactive and hidden'}
                    </Label>
                </div>
            </FormField>
        </FormWrapper>
    );
}
