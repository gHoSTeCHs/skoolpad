import { Link, useForm } from '@inertiajs/react';
import InstitutionController from '@/actions/App/Http/Controllers/Admin/InstitutionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { institutionTypeLabels, ownershipTypeLabels } from '@/lib/enum-labels';
import type { Country, Institution } from '@/types/models';

interface EnumCase {
    value: string;
}

interface InstitutionFormProps {
    institution?: Institution;
    institutionTypes: EnumCase[];
    ownershipTypes: EnumCase[];
    countries: Country[];
}

export default function InstitutionForm({ institution, institutionTypes, ownershipTypes, countries }: InstitutionFormProps) {
    const isEditing = !!institution?.id;

    const form = useForm({
        name: institution?.name ?? '',
        abbreviation: institution?.abbreviation ?? '',
        institution_type: institution?.institution_type ?? '',
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

        if (isEditing) {
            form.put(InstitutionController.update.url(institution!.id));
        } else {
            form.post(InstitutionController.store.url());
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. University of Lagos"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="abbreviation">Abbreviation</Label>
                            <Input
                                id="abbreviation"
                                value={form.data.abbreviation}
                                onChange={(e) => form.setData('abbreviation', e.target.value)}
                                placeholder="e.g. UNILAG"
                            />
                            <InputError message={form.errors.abbreviation} />
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="institution_type">Institution Type</Label>
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
                                            {institutionTypeLabels[type.value] ?? type.value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.institution_type} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownership_type">Ownership Type</Label>
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
                                            {ownershipTypeLabels[type.value] ?? type.value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.ownership_type} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country_id">Country</Label>
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
                        <InputError message={form.errors.country_id} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                value={form.data.state}
                                onChange={(e) => form.setData('state', e.target.value)}
                                placeholder="e.g. Lagos"
                            />
                            <InputError message={form.errors.state} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={form.data.city}
                                onChange={(e) => form.setData('city', e.target.value)}
                                placeholder="e.g. Akoka"
                            />
                            <InputError message={form.errors.city} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="logo">Logo</Label>
                        {isEditing && institution?.logo_path && !form.data.logo && (
                            <p className="text-xs text-muted-foreground">Current logo uploaded. Upload a new one to replace it.</p>
                        )}
                        <Input
                            id="logo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => form.setData('logo', e.target.files?.[0] ?? null)}
                        />
                        <InputError message={form.errors.logo} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            value={form.data.website}
                            onChange={(e) => form.setData('website', e.target.value)}
                            placeholder="e.g. https://unilag.edu.ng"
                        />
                        <InputError message={form.errors.website} />
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="is_active"
                            checked={form.data.is_active}
                            onCheckedChange={(checked) => form.setData('is_active', checked)}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                </CardContent>

                <CardFooter className="justify-end gap-3 border-t pt-6">
                    <Button variant="outline" asChild>
                        <Link href={InstitutionController.index.url()}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {isEditing ? 'Update Institution' : 'Create Institution'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
