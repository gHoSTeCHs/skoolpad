import { useForm } from '@inertiajs/react';
import GradingScaleController from '@/actions/App/Http/Controllers/Admin/GradingScaleController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { GradingScale } from '@/types/models';

interface GradingScaleFormProps {
    gradingScale?: GradingScale;
    scaleTypes: { value: string; label: string }[];
}

export default function GradingScaleForm({ gradingScale, scaleTypes }: GradingScaleFormProps) {
    const isEditing = !!gradingScale?.id;

    const form = useForm({
        name: gradingScale?.name ?? '',
        scale_type: gradingScale?.scale_type ?? '',
        scale_min: gradingScale?.scale_min ?? 0,
        scale_max: gradingScale?.scale_max ?? 100,
        pass_threshold: gradingScale?.pass_threshold ?? 40,
        grade_boundaries: gradingScale?.grade_boundaries ? JSON.stringify(gradingScale.grade_boundaries, null, 2) : '',
        classification_labels: gradingScale?.classification_labels ? JSON.stringify(gradingScale.classification_labels, null, 2) : '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            form.put(GradingScaleController.update.url(gradingScale!.id));
        } else {
            form.post(GradingScaleController.store.url());
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={GradingScaleController.index.url()}
            submitLabel={isEditing ? 'Update Grading Scale' : 'Create Grading Scale'}
            isSubmitting={form.processing}
        >
            <FormField label="Name" name="name" error={form.errors.name} required>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="e.g. WAEC Standard Grading"
                />
            </FormField>

            <FormField label="Scale Type" name="scale_type" error={form.errors.scale_type} required>
                <Select
                    value={form.data.scale_type}
                    onValueChange={(value) => form.setData('scale_type', value)}
                >
                    <SelectTrigger id="scale_type">
                        <SelectValue placeholder="Select scale type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {scaleTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label="Scale Min" name="scale_min" error={form.errors.scale_min} required>
                <Input
                    id="scale_min"
                    type="number"
                    value={form.data.scale_min}
                    onChange={(e) => form.setData('scale_min', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                />
            </FormField>

            <FormField label="Scale Max" name="scale_max" error={form.errors.scale_max} required>
                <Input
                    id="scale_max"
                    type="number"
                    value={form.data.scale_max}
                    onChange={(e) => form.setData('scale_max', parseFloat(e.target.value) || 0)}
                    placeholder="100"
                />
            </FormField>

            <FormField label="Pass Threshold" name="pass_threshold" error={form.errors.pass_threshold} required>
                <Input
                    id="pass_threshold"
                    type="number"
                    value={form.data.pass_threshold}
                    onChange={(e) => form.setData('pass_threshold', parseFloat(e.target.value) || 0)}
                    placeholder="40"
                />
            </FormField>

            <FormField
                label="Grade Boundaries"
                name="grade_boundaries"
                error={form.errors.grade_boundaries}
                description="JSON array of grade boundary objects"
                required
            >
                <Textarea
                    id="grade_boundaries"
                    value={form.data.grade_boundaries}
                    onChange={(e) => form.setData('grade_boundaries', e.target.value)}
                    placeholder='[{"grade": "A", "min": 70, "max": 100, "points": 5}]'
                    rows={6}
                    className="font-mono text-sm"
                />
            </FormField>

            <FormField
                label="Classification Labels"
                name="classification_labels"
                error={form.errors.classification_labels}
                description="JSON object for CGPA classification labels"
            >
                <Textarea
                    id="classification_labels"
                    value={form.data.classification_labels}
                    onChange={(e) => form.setData('classification_labels', e.target.value)}
                    placeholder='{"first_class": "First Class Honours", "second_upper": "Second Class Upper"}'
                    rows={4}
                    className="font-mono text-sm"
                />
            </FormField>
        </FormWrapper>
    );
}
