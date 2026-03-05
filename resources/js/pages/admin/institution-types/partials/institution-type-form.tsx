import { useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import InstitutionTypeController from '@/actions/App/Http/Controllers/Admin/InstitutionTypeController';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSlug } from '@/hooks/use-slug';
import type { InstitutionTypeModel } from '@/types/models';

interface InstitutionTypeFormProps {
    institutionType?: InstitutionTypeModel;
    countries: { id: string; name: string }[];
    gradingScales: { id: string; name: string }[];
}

export default function InstitutionTypeForm({ institutionType, countries, gradingScales }: InstitutionTypeFormProps) {
    const isEditing = !!institutionType?.id;
    const { generateSlug, slugManuallyEdited, resetSlugTracking } = useSlug();

    const form = useForm({
        country_id: institutionType?.country_id ?? '',
        name: institutionType?.name ?? '',
        slug: institutionType?.slug ?? '',
        level_progression: institutionType?.level_progression ?? ([] as string[]),
        credit_system: institutionType?.credit_system ?? '',
        grading_scale_id: institutionType?.grading_scale_id ?? '',
        qualification_names: institutionType?.qualification_names ?? ([] as string[]),
    });

    const [levelInput, setLevelInput] = useState('');
    const [qualInput, setQualInput] = useState('');

    if (isEditing) {
        slugManuallyEdited.current = true;
    } else {
        resetSlugTracking();
    }

    function handleNameChange(value: string) {
        form.setData('name', value);
        if (!slugManuallyEdited.current) {
            form.setData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
        }
    }

    function addLevel(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && levelInput.trim()) {
            e.preventDefault();
            form.setData('level_progression', [...form.data.level_progression, levelInput.trim()]);
            setLevelInput('');
        }
    }

    function removeLevel(index: number) {
        form.setData('level_progression', form.data.level_progression.filter((_, i) => i !== index));
    }

    function addQualification(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && qualInput.trim()) {
            e.preventDefault();
            form.setData('qualification_names', [...form.data.qualification_names, qualInput.trim()]);
            setQualInput('');
        }
    }

    function removeQualification(index: number) {
        form.setData('qualification_names', form.data.qualification_names.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const data = {
            ...form.data,
            grading_scale_id: form.data.grading_scale_id || null,
        };

        if (isEditing) {
            form.transform(() => data);
            form.put(InstitutionTypeController.update.url(institutionType!.id));
        } else {
            form.transform(() => data);
            form.post(InstitutionTypeController.store.url());
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={InstitutionTypeController.index.url()}
            submitLabel={isEditing ? 'Update Institution Type' : 'Create Institution Type'}
            isSubmitting={form.processing}
        >
            <FormField label="Country" name="country_id" error={form.errors.country_id} required>
                <Select
                    value={form.data.country_id}
                    onValueChange={(value) => form.setData('country_id', value)}
                >
                    <SelectTrigger id="country_id">
                        <SelectValue placeholder="Select country..." />
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

            <FormField label="Name" name="name" error={form.errors.name} required>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. University"
                />
            </FormField>

            <FormField label="Slug" name="slug" error={form.errors.slug}>
                <Input
                    id="slug"
                    value={form.data.slug}
                    onChange={(e) => {
                        slugManuallyEdited.current = true;
                        form.setData('slug', e.target.value);
                    }}
                    placeholder="e.g. university"
                />
            </FormField>

            <FormField
                label="Level Progression"
                name="level_progression"
                error={form.errors.level_progression}
                description="Press Enter to add each level (e.g. 100L, 200L, 300L)"
                required
            >
                <div className="space-y-2">
                    <Input
                        value={levelInput}
                        onChange={(e) => setLevelInput(e.target.value)}
                        onKeyDown={addLevel}
                        placeholder="Type a level and press Enter..."
                    />
                    {form.data.level_progression.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {form.data.level_progression.map((level, i) => (
                                <Badge key={i} variant="secondary" className="gap-1">
                                    {level}
                                    <button type="button" onClick={() => removeLevel(i)} className="hover:text-destructive">
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </FormField>

            <FormField label="Credit System" name="credit_system" error={form.errors.credit_system}>
                <Input
                    id="credit_system"
                    value={form.data.credit_system}
                    onChange={(e) => form.setData('credit_system', e.target.value)}
                    placeholder="e.g. Credit Units"
                />
            </FormField>

            <FormField label="Grading Scale" name="grading_scale_id" error={form.errors.grading_scale_id}>
                <Select
                    value={form.data.grading_scale_id ?? ''}
                    onValueChange={(value) => form.setData('grading_scale_id', value === 'none' ? '' : value)}
                >
                    <SelectTrigger id="grading_scale_id">
                        <SelectValue placeholder="Select grading scale..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {gradingScales.map((scale) => (
                            <SelectItem key={scale.id} value={scale.id}>
                                {scale.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>

            <FormField
                label="Qualification Names"
                name="qualification_names"
                error={form.errors.qualification_names}
                description="Press Enter to add each qualification (e.g. B.Sc., B.A., B.Eng.)"
            >
                <div className="space-y-2">
                    <Input
                        value={qualInput}
                        onChange={(e) => setQualInput(e.target.value)}
                        onKeyDown={addQualification}
                        placeholder="Type a qualification and press Enter..."
                    />
                    {form.data.qualification_names.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {form.data.qualification_names.map((qual, i) => (
                                <Badge key={i} variant="secondary" className="gap-1">
                                    {qual}
                                    <button type="button" onClick={() => removeQualification(i)} className="hover:text-destructive">
                                        <X className="size-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </FormField>
        </FormWrapper>
    );
}
