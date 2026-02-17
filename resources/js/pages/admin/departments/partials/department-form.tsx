import { Link, useForm } from '@inertiajs/react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Department } from '@/types/models';

interface FacultyWithInstitution {
    id: string;
    name: string;
    institution_id: string;
    institution?: { id: string; name: string };
}

interface DepartmentFormProps {
    department?: Department;
    faculties: FacultyWithInstitution[];
}

export default function DepartmentForm({ department, faculties }: DepartmentFormProps) {
    const isEditing = !!department?.id;

    const form = useForm({
        faculty_id: department?.faculty_id ?? '',
        name: department?.name ?? '',
        abbreviation: department?.abbreviation ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            form.put(DepartmentController.update.url(department!.id));
        } else {
            form.post(DepartmentController.store.url());
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="faculty_id">Faculty</Label>
                        <Select
                            value={form.data.faculty_id}
                            onValueChange={(value) => form.setData('faculty_id', value)}
                        >
                            <SelectTrigger id="faculty_id">
                                <SelectValue placeholder="Select faculty" />
                            </SelectTrigger>
                            <SelectContent>
                                {faculties.map((faculty) => (
                                    <SelectItem key={faculty.id} value={faculty.id}>
                                        {faculty.name}{faculty.institution ? ` — ${faculty.institution.name}` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.faculty_id} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Department of Computer Science"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="abbreviation">Abbreviation</Label>
                            <Input
                                id="abbreviation"
                                value={form.data.abbreviation}
                                onChange={(e) => form.setData('abbreviation', e.target.value)}
                                placeholder="e.g. CSC"
                            />
                            <InputError message={form.errors.abbreviation} />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="justify-end gap-3 border-t pt-6">
                    <Button variant="outline" asChild>
                        <Link href={DepartmentController.index.url()}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {isEditing ? 'Update Department' : 'Create Department'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
