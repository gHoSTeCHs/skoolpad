import { useForm } from '@inertiajs/react';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSlug } from '@/hooks/use-slug';
import type { Country, ExamType } from '@/types/models';

interface ExamTypeFormProps {
    examType?: ExamType;
    countries: Country[];
}

export default function ExamTypeForm({ examType, countries }: ExamTypeFormProps) {
    const isEditing = !!examType?.id;
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm({
        name: examType?.name ?? '',
        slug: examType?.slug ?? '',
        country_id: examType?.country_id ?? '',
        description: examType?.description ?? '',
        duration_minutes: examType?.duration_minutes?.toString() ?? '',
        questions_per_subject: examType?.questions_per_subject?.toString() ?? '',
        is_active: examType?.is_active ?? false,
    });

    function handleNameChange(value: string) {
        form.setData('name', value);
        if (!slugManuallyEdited.current) {
            form.setData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            form.put(ExamTypeController.update.url(examType!.id));
        } else {
            form.post(ExamTypeController.store.url());
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={ExamTypeController.index.url()}
            submitLabel={isEditing ? 'Update Exam Type' : 'Create Exam Type'}
            isSubmitting={form.processing}
        >
            <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Name" name="name" error={form.errors.name} required>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. JAMB UTME"
                    />
                </FormField>

                <FormField label="Slug" name="slug" error={form.errors.slug} required>
                    <Input
                        id="slug"
                        value={form.data.slug}
                        onChange={(e) => {
                            slugManuallyEdited.current = true;
                            form.setData('slug', e.target.value);
                        }}
                        placeholder="e.g. jamb-utme"
                    />
                </FormField>
            </div>

            <FormField label="Country" name="country_id" error={form.errors.country_id} required>
                <Select
                    value={form.data.country_id}
                    onValueChange={(value) => form.setData('country_id', value)}
                >
                    <SelectTrigger id="country_id">
                        <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                                {country.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label="Description" name="description" error={form.errors.description}>
                <Textarea
                    id="description"
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    placeholder="A brief description of this exam type"
                />
            </FormField>

            <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Duration (minutes)" name="duration_minutes" error={form.errors.duration_minutes} required>
                    <Input
                        id="duration_minutes"
                        type="number"
                        value={form.data.duration_minutes}
                        onChange={(e) => form.setData('duration_minutes', e.target.value)}
                        placeholder="e.g. 120"
                    />
                </FormField>

                <FormField
                    label="Questions per Subject"
                    name="questions_per_subject"
                    error={form.errors.questions_per_subject}
                    required
                >
                    <Input
                        id="questions_per_subject"
                        type="number"
                        value={form.data.questions_per_subject}
                        onChange={(e) => form.setData('questions_per_subject', e.target.value)}
                        placeholder="e.g. 40"
                    />
                </FormField>
            </div>

            <div className="flex items-center gap-3">
                <Switch
                    id="is_active"
                    checked={form.data.is_active}
                    onCheckedChange={(checked) => form.setData('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
            </div>
        </FormWrapper>
    );
}
