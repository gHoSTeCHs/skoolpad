import { useForm } from '@inertiajs/react';
import DepartmentController from '@/actions/App/Http/Controllers/Admin/DepartmentController';
import { FormField } from '@/components/ui/form-field';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Department } from '@/types/models';

interface FacultyWithInstitution {
    id: string;
    name: string;
    institution?: { id: string; name: string } | null;
}

interface DepartmentFormProps {
    department?: Department;
    faculty: FacultyWithInstitution;
}

export default function DepartmentForm({ department, faculty }: DepartmentFormProps) {
    const isEditing = !!department?.id;

    const form = useForm({
        name: department?.name ?? '',
        abbreviation: department?.abbreviation ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEditing) {
            form.put(DepartmentController.update.url(department!.id));
        } else {
            form.post(DepartmentController.store.url(faculty.id));
        }
    }

    return (
        <FormWrapper
            onSubmit={handleSubmit}
            cancelUrl={DepartmentController.index.url(faculty.id)}
            submitLabel={isEditing ? 'Update Department' : 'Create Department'}
            isSubmitting={form.processing}
        >
            <div className="space-y-2">
                <Label>Faculty</Label>
                <p className="text-sm text-muted-foreground">
                    {faculty.name}{faculty.institution ? ` — ${faculty.institution.name}` : ''}
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Name" name="name" error={form.errors.name} required>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="e.g. Department of Computer Science"
                    />
                </FormField>

                <FormField label="Abbreviation" name="abbreviation" error={form.errors.abbreviation}>
                    <Input
                        id="abbreviation"
                        value={form.data.abbreviation}
                        onChange={(e) => form.setData('abbreviation', e.target.value)}
                        placeholder="e.g. CSC"
                    />
                </FormField>
            </div>
        </FormWrapper>
    );
}
