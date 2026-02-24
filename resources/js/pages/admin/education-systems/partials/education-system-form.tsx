import { useForm } from '@inertiajs/react';
import EducationSystemController from '@/actions/App/Http/Controllers/Admin/EducationSystemController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSlug } from '@/hooks/use-slug';
import type { Country, EducationSystem } from '@/types/models';

interface EnumOption {
    value: string;
    label: string;
}

interface EducationSystemFormProps {
    educationSystem?: EducationSystem;
    systemTypes: EnumOption[];
    countries: Country[];
}

export default function EducationSystemForm({ educationSystem, systemTypes, countries }: EducationSystemFormProps) {
    const isEditing = !!educationSystem?.id;
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm({
        name: educationSystem?.name ?? '',
        slug: educationSystem?.slug ?? '',
        system_type: educationSystem?.system_type ?? '',
        country_id: educationSystem?.country_id ?? '',
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
            form.put(EducationSystemController.update.url(educationSystem!.id));
        } else {
            form.post(EducationSystemController.store.url());
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={EducationSystemController.index.url()}
            submitLabel={isEditing ? 'Update System' : 'Create System'}
            isSubmitting={form.processing}
        >
            <FormField label="Name" name="name" error={form.errors.name} required>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. NERDC"
                />
            </FormField>

            <FormField label="Slug" name="slug" error={form.errors.slug} required={isEditing}>
                <Input
                    id="slug"
                    value={form.data.slug}
                    onChange={(e) => {
                        slugManuallyEdited.current = true;
                        form.setData('slug', e.target.value);
                    }}
                    placeholder="e.g. nerdc"
                />
            </FormField>

            <FormField label="System Type" name="system_type" error={form.errors.system_type} required>
                <Select
                    value={form.data.system_type}
                    onValueChange={(value) => form.setData('system_type', value)}
                >
                    <SelectTrigger id="system_type">
                        <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {systemTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField label="Country" name="country_id" error={form.errors.country_id} description="Leave empty for international systems">
                <Select
                    value={form.data.country_id ?? ''}
                    onValueChange={(value) => form.setData('country_id', value === 'none' ? '' : value)}
                >
                    <SelectTrigger id="country_id">
                        <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No country (International)</SelectItem>
                        {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                                {country.name} ({country.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
        </FormWrapper>
    );
}
