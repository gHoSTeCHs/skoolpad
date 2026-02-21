import { Link, useForm } from '@inertiajs/react';
import DisciplineController from '@/actions/App/Http/Controllers/Admin/DisciplineController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. Computer Science"
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={form.data.slug}
                            onChange={(e) => {
                                slugManuallyEdited.current = true;
                                form.setData('slug', e.target.value);
                            }}
                            placeholder="e.g. computer-science"
                        />
                        <InputError message={form.errors.slug} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="A brief description of this discipline"
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Icon</Label>
                        <Input
                            id="icon"
                            value={form.data.icon}
                            onChange={(e) => form.setData('icon', e.target.value)}
                            placeholder="e.g. cpu (lucide icon name)"
                        />
                        <InputError message={form.errors.icon} />
                    </div>
                </CardContent>

                <CardFooter className="justify-end gap-3 border-t pt-6">
                    <Button variant="outline" asChild>
                        <Link href={DisciplineController.index.url()}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {isEditing ? 'Update Discipline' : 'Create Discipline'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
