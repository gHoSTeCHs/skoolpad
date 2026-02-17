import { Link, useForm } from '@inertiajs/react';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Faculty } from '@/types/models';
import React from 'react';

interface FacultyFormProps {
    faculty?: Faculty;
    institutions: { id: string; name: string; abbreviation?: string }[];
}

export default function FacultyForm({ faculty, institutions }: FacultyFormProps) {
    const isEditing = !!faculty?.id;

    const form = useForm({
        institution_id: faculty?.institution_id ?? '',
        name: faculty?.name ?? '',
        abbreviation: faculty?.abbreviation ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            form.put(FacultyController.update.url(faculty!.id));
        } else {
            form.post(FacultyController.store.url());
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="institution_id">Institution</Label>
                        <Select
                            value={form.data.institution_id}
                            onValueChange={(value) => form.setData('institution_id', value)}
                        >
                            <SelectTrigger id="institution_id">
                                <SelectValue placeholder="Select institution" />
                            </SelectTrigger>
                            <SelectContent>
                                {institutions.map((institution) => (
                                    <SelectItem key={institution.id} value={institution.id}>
                                        {institution.name}{institution.abbreviation ? ` (${institution.abbreviation})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.institution_id} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Faculty of Engineering"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="abbreviation">Abbreviation</Label>
                            <Input
                                id="abbreviation"
                                value={form.data.abbreviation}
                                onChange={(e) => form.setData('abbreviation', e.target.value)}
                                placeholder="e.g. FOE"
                            />
                            <InputError message={form.errors.abbreviation} />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="justify-end gap-3 border-t pt-6">
                    <Button variant="outline" asChild>
                        <Link href={FacultyController.index.url()}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {isEditing ? 'Update Faculty' : 'Create Faculty'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
