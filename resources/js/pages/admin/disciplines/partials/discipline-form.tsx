import { useForm } from '@inertiajs/react';
import DisciplineController from '@/actions/App/Http/Controllers/Admin/DisciplineController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSlug } from '@/hooks/use-slug';
import type { Discipline } from '@/types/models';

interface DisciplineFormProps {
    discipline?: Discipline;
}

export default function DisciplineForm({ discipline }: DisciplineFormProps) {
    const isEditing = !!discipline?.id;
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm({
        name: discipline?.name ?? '',
        slug: discipline?.slug ?? '',
        description: discipline?.description ?? '',
        icon: discipline?.icon ?? '',
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
            form.put(DisciplineController.update.url(discipline!.id));
        } else {
            form.post(DisciplineController.store.url());
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={DisciplineController.index.url()}
            submitLabel={isEditing ? 'Update Discipline' : 'Create Discipline'}
            isSubmitting={form.processing}
        >
            <FormField label="Name" name="name" error={form.errors.name} required>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Computer Science"
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
                    placeholder="e.g. computer-science"
                />
            </FormField>

            <FormField label="Description" name="description" error={form.errors.description}>
                <Textarea
                    id="description"
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    placeholder="A brief description of this discipline"
                />
            </FormField>

            <FormField label="Icon" name="icon" error={form.errors.icon}>
                <Input
                    id="icon"
                    value={form.data.icon}
                    onChange={(e) => form.setData('icon', e.target.value)}
                    placeholder="e.g. cpu (lucide icon name)"
                />
            </FormField>
        </FormWrapper>
    );
}
