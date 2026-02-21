import { Link, useForm } from '@inertiajs/react';
import ExamSubjectController from '@/actions/App/Http/Controllers/Admin/ExamSubjectController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSlug } from '@/hooks/use-slug';
import type { ExamSubject } from '@/types/models';

interface ExamSubjectFormProps {
    examSubject?: ExamSubject;
    examType: { id: string; name: string };
}

export default function ExamSubjectForm({ examSubject, examType }: ExamSubjectFormProps) {
    const isEditing = !!examSubject?.id;
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm({
        name: examSubject?.name ?? '',
        slug: examSubject?.slug ?? '',
        is_compulsory: examSubject?.is_compulsory ?? false,
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
            form.put(ExamSubjectController.update.url(examSubject!.id));
        } else {
            form.post(ExamSubjectController.store.url(examType.id));
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Exam Type</Label>
                        <p className="text-sm text-muted-foreground">{examType.name}</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. Mathematics"
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
                                placeholder="e.g. mathematics"
                            />
                            <InputError message={form.errors.slug} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="is_compulsory"
                            checked={form.data.is_compulsory}
                            onCheckedChange={(checked) => form.setData('is_compulsory', checked)}
                        />
                        <Label htmlFor="is_compulsory">Compulsory</Label>
                    </div>
                </CardContent>

                <CardFooter className="justify-end gap-3 border-t pt-6">
                    <Button variant="outline" asChild>
                        <Link href={ExamSubjectController.index.url(examType.id)}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {isEditing ? 'Update Subject' : 'Create Subject'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
