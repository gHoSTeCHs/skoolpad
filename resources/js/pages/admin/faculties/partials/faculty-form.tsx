import { Link, useForm } from '@inertiajs/react';
import FacultyController from '@/actions/App/Http/Controllers/Admin/FacultyController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Faculty } from '@/types/models';

interface FacultyFormProps {
    faculty?: Faculty;
    institution: { id: string; name: string; abbreviation?: string };
}

export default function FacultyForm({ faculty, institution }: FacultyFormProps) {
    const isEditing = !!faculty?.id;

    const form = useForm({
        name: faculty?.name ?? '',
        abbreviation: faculty?.abbreviation ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            form.put(FacultyController.update.url(faculty!.id));
        } else {
            form.post(FacultyController.store.url(institution.id));
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Institution</Label>
                        <p className="text-sm text-muted-foreground">
                            {institution.name}{institution.abbreviation ? ` (${institution.abbreviation})` : ''}
                        </p>
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
                        <Link href={FacultyController.index.url(institution.id)}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {isEditing ? 'Update Faculty' : 'Create Faculty'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
