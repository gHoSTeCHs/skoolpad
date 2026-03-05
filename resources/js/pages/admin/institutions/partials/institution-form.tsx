import { useForm } from '@inertiajs/react';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Country, Institution } from '@/types/models';

interface EnumOption {
    value: string;
    label: string;
}

interface InstitutionFormProps {
    institution?: Institution;
    institutionTypes: EnumOption[];
    institutionTypeModels?: { id: string; name: string }[];
    ownershipTypes: EnumOption[];
    countries: Country[];
}

export default function InstitutionForm({ institution, institutionTypes, institutionTypeModels, ownershipTypes, countries }: InstitutionFormProps) {
    const isEditing = !!institution?.id;

    const form = useForm({
        name: institution?.name ?? '',
        abbreviation: institution?.abbreviation ?? '',
        institution_type: institution?.institution_type ?? '',
        institution_type_id: institution?.institution_type_id ?? '',
        ownership_type: institution?.ownership_type ?? '',
        country_id: institution?.country_id ?? '',
        state: institution?.state ?? '',
        city: institution?.city ?? '',
        website: institution?.website ?? '',
        logo: null as File | null,
        is_active: institution?.is_active ?? true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const data = {
            ...form.data,
            institution_type_id: form.data.institution_type_id || null,
        };

        if (isEditing) {
            form.transform(() => data);
            form.put(InstitutionController.update.url(institution!.id));
        } else {
            form.transform(() => data);
            form.post(InstitutionController.store.url());
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={InstitutionController.index.url()}
            submitLabel={isEditing ? 'Update Institution' : 'Create Institution'}
            isSubmitting={form.processing}
        >
            <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="Name" name="name" error={form.errors.name} required>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. University of Lagos"
                            />
                        </FormField>

                        <FormField label="Abbreviation" name="abbreviation" error={form.errors.abbreviation}>
                            <Input
                                id="abbreviation"
                                value={form.data.abbreviation}
                                onChange={(e) => form.setData('abbreviation', e.target.value)}
                                placeholder="e.g. UNILAG"
                            />
                        </FormField>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="Institution Type" name="institution_type" error={form.errors.institution_type} required>
                            <Select
                                value={form.data.institution_type}
                                onValueChange={(value) => form.setData('institution_type', value)}
                            >
                                <SelectTrigger id="institution_type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {institutionTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Ownership Type" name="ownership_type" error={form.errors.ownership_type} required>
                            <Select
                                value={form.data.ownership_type}
                                onValueChange={(value) => form.setData('ownership_type', value)}
                            >
                                <SelectTrigger id="ownership_type">
                                    <SelectValue placeholder="Select ownership" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ownershipTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>

                    {institutionTypeModels && institutionTypeModels.length > 0 && (
                        <FormField label="Institution Type (Detailed)" name="institution_type_id" error={form.errors.institution_type_id} description="Links to a detailed institution type with level progression and grading scale.">
                            <Select
                                value={form.data.institution_type_id ?? ''}
                                onValueChange={(value) => form.setData('institution_type_id', value === 'none' ? '' : value)}
                            >
                                <SelectTrigger id="institution_type_id">
                                    <SelectValue placeholder="Select detailed type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {institutionTypeModels.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    )}

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

                    <div className="grid gap-6 sm:grid-cols-2">
                        <FormField label="State" name="state" error={form.errors.state}>
                            <Input
                                id="state"
                                value={form.data.state}
                                onChange={(e) => form.setData('state', e.target.value)}
                                placeholder="e.g. Lagos"
                            />
                        </FormField>

                        <FormField label="City" name="city" error={form.errors.city}>
                            <Input
                                id="city"
                                value={form.data.city}
                                onChange={(e) => form.setData('city', e.target.value)}
                                placeholder="e.g. Akoka"
                            />
                        </FormField>
                    </div>

                    <FormField
                        label="Logo"
                        name="logo"
                        error={form.errors.logo}
                        description={
                            isEditing && institution?.logo_path && !form.data.logo
                                ? 'Current logo uploaded. Upload a new one to replace it.'
                                : undefined
                        }
                    >
                        <Input
                            id="logo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => form.setData('logo', e.target.files?.[0] ?? null)}
                        />
                    </FormField>

                    <FormField label="Website" name="website" error={form.errors.website}>
                        <Input
                            id="website"
                            type="url"
                            value={form.data.website}
                            onChange={(e) => form.setData('website', e.target.value)}
                            placeholder="e.g. https://unilag.edu.ng"
                        />
                    </FormField>

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
