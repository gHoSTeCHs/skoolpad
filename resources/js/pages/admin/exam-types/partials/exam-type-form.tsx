import { Link, useForm } from '@inertiajs/react';
import ExamTypeController from '@/actions/App/Http/Controllers/Admin/ExamTypeController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSlug } from '@/hooks/use-slug';
import type { Country, ExamType } from '@/types/models';

interface ExamTypeFormProps {
    examType?: ExamType;
    countries: Country[];
}

export default function ExamTypeForm({ examType, countries }: ExamTypeFormProps) {
    const isEditing = !!examType?.id;
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm({
        name: examType?.name ?? '',
        slug: examType?.slug ?? '',
        country_id: examType?.country_id ?? '',
        description: examType?.description ?? '',
        duration_minutes: examType?.duration_minutes?.toString() ?? '',
        questions_per_subject: examType?.questions_per_subject?.toString() ?? '',
        is_active: examType?.is_active ?? false,
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
            form.put(ExamTypeController.update.url(examType!.id));
        } else {
            form.post(ExamTypeController.store.url());
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
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. JAMB UTME"
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
                                placeholder="e.g. jamb-utme"
                            />
                            <InputError message={form.errors.slug} />
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

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                            placeholder="A brief description of this exam type"
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                            <Input
                                id="duration_minutes"
                                type="number"
                                value={form.data.duration_minutes}
                                onChange={(e) => form.setData('duration_minutes', e.target.value)}
                                placeholder="e.g. 120"
                            />
                            <InputError message={form.errors.duration_minutes} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="questions_per_subject">Questions per Subject</Label>
                            <Input
                                id="questions_per_subject"
                                type="number"
                                value={form.data.questions_per_subject}
                                onChange={(e) => form.setData('questions_per_subject', e.target.value)}
                                placeholder="e.g. 40"
                            />
                            <InputError message={form.errors.questions_per_subject} />
                        </div>
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
                        <Link href={ExamTypeController.index.url()}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {isEditing ? 'Update Exam Type' : 'Create Exam Type'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
