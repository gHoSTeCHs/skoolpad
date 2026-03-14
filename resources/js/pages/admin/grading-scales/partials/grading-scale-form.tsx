import { useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import GradingScaleController from '@/actions/App/Http/Controllers/Admin/GradingScaleController';
import InputError from '@/components/input-error';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { GradingScale } from '@/types/models';

type GradeBoundaryRow = { grade: string; min: string; max: string; points: string };

interface GradingScaleFormProps {
    gradingScale?: GradingScale;
    scaleTypes: { value: string; label: string }[];
}

function emptyRow(): GradeBoundaryRow {
    return { grade: '', min: '', max: '', points: '' };
}

function fromModel(boundaries: GradingScale['grade_boundaries']): GradeBoundaryRow[] {
    if (!boundaries || boundaries.length === 0) return [emptyRow()];
    return boundaries.map((b) => ({
        grade: String(b.label),
        min: String(b.min),
        max: String(b.max),
        points: String(b.gp),
    }));
}

export default function GradingScaleForm({ gradingScale, scaleTypes }: GradingScaleFormProps) {
    const isEditing = !!gradingScale?.id;

    const form = useForm({
        name: gradingScale?.name ?? '',
        scale_type: gradingScale?.scale_type ?? '',
        scale_min: gradingScale?.scale_min ?? 0,
        scale_max: gradingScale?.scale_max ?? 100,
        pass_threshold: gradingScale?.pass_threshold ?? 40,
        grade_boundaries: fromModel(gradingScale?.grade_boundaries ?? null),
        classification_labels: gradingScale?.classification_labels ? JSON.stringify(gradingScale.classification_labels, null, 2) : '',
    });

    function addRow() {
        form.setData('grade_boundaries', [...form.data.grade_boundaries, emptyRow()]);
    }

    function removeRow(index: number) {
        form.setData(
            'grade_boundaries',
            form.data.grade_boundaries.filter((_, i) => i !== index),
        );
    }

    function updateRow(index: number, field: keyof GradeBoundaryRow, value: string) {
        const updated = form.data.grade_boundaries.map((row, i) =>
            i === index ? { ...row, [field]: value } : row,
        );
        form.setData('grade_boundaries', updated);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            form.put(GradingScaleController.update.url(gradingScale!.id));
        } else {
            form.post(GradingScaleController.store.url());
        }
    }

    const rowErrors = (index: number, field: keyof GradeBoundaryRow) =>
        form.errors[`grade_boundaries.${index}.${field}` as keyof typeof form.errors];

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

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                        Grade Boundaries <span className="text-destructive">*</span>
                    </span>
                </div>

                {form.errors.grade_boundaries && (
                    <InputError message={form.errors.grade_boundaries} />
                )}

                <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-1">
                        <span className="text-muted-foreground text-xs font-medium">Grade</span>
                        <span className="text-muted-foreground text-xs font-medium">Min</span>
                        <span className="text-muted-foreground text-xs font-medium">Max</span>
                        <span className="text-muted-foreground text-xs font-medium">Points</span>
                        <span />
                    </div>

                    {form.data.grade_boundaries.map((row, index) => (
                        <div key={index} className="space-y-1">
                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2">
                                <Input
                                    value={row.grade}
                                    onChange={(e) => updateRow(index, 'grade', e.target.value)}
                                    placeholder="A1"
                                />
                                <Input
                                    type="number"
                                    value={row.min}
                                    onChange={(e) => updateRow(index, 'min', e.target.value)}
                                    placeholder="0"
                                />
                                <Input
                                    type="number"
                                    value={row.max}
                                    onChange={(e) => updateRow(index, 'max', e.target.value)}
                                    placeholder="100"
                                />
                                <Input
                                    type="number"
                                    value={row.points}
                                    onChange={(e) => updateRow(index, 'points', e.target.value)}
                                    placeholder="7"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeRow(index)}
                                    disabled={form.data.grade_boundaries.length === 1}
                                    aria-label="Remove row"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                            {(rowErrors(index, 'grade') || rowErrors(index, 'min') || rowErrors(index, 'max') || rowErrors(index, 'points')) && (
                                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-1">
                                    <InputError message={rowErrors(index, 'grade')} />
                                    <InputError message={rowErrors(index, 'min')} />
                                    <InputError message={rowErrors(index, 'max')} />
                                    <InputError message={rowErrors(index, 'points')} />
                                    <span />
                                </div>
                            )}
                        </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" onClick={addRow}>
                        <Plus className="mr-1.5 size-3.5" />
                        Add Grade
                    </Button>
                </div>
            </div>

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
