import { useForm } from '@inertiajs/react';
import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSlug } from '@/hooks/use-slug';
import type { ExamSubject } from '@/types/models';

interface ExamSubjectFormProps {
    examSubject?: ExamSubject;
    examType: { id: string; name: string };
}

export default function ExamSubjectForm({ examSubject, examType }: ExamSubjectFormProps) {
    const isEditing = !!examSubject?.id;
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm({
        name: examSubject?.name ?? '',
        slug: examSubject?.slug ?? '',
        is_compulsory: examSubject?.is_compulsory ?? false,
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
            form.put(ExamSubjectController.update.url(examSubject!.id));
        } else {
            form.post(ExamSubjectController.store.url(examType.id));
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={ExamSubjectController.index.url(examType.id)}
            submitLabel={isEditing ? 'Update Subject' : 'Create Subject'}
            isSubmitting={form.processing}
        >
            <div className="space-y-2">
                <Label>Exam Type</Label>
                <p className="text-sm text-muted-foreground">{examType.name}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Name" name="name" error={form.errors.name} required>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Mathematics"
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
                        placeholder="e.g. mathematics"
                    />
                </FormField>
            </div>

            <div className="flex items-center gap-3">
                <Switch
                    id="is_compulsory"
                    checked={form.data.is_compulsory}
                    onCheckedChange={(checked) => form.setData('is_compulsory', checked)}
                />
                <Label htmlFor="is_compulsory">Compulsory</Label>
            </div>
        </FormWrapper>
    );
}
