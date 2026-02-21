import { Head, Link, useForm } from '@inertiajs/react';
import { Info } from 'lucide-react';
import CanonicalTopicController from '@/actions/App/Http/Controllers/Admin/CanonicalTopicController';
import InputError from '@/components/input-error';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSlug } from '@/hooks/use-slug';
import AdminLayout from '@/layouts/admin-layout';
import type { TiptapJSON } from '@/types/tiptap';
import type { DifficultyOption, Discipline, TopicDifficulty, TopicPrerequisite } from '@/types/topics';

interface Props {
    disciplines: Discipline[];
    difficulty_levels: DifficultyOption[];
}

const breadcrumbs = [
    { title: 'Topics', href: '/admin/topics' },
    { title: 'Create', href: '/admin/topics/create' },
];

export default function AdminTopicsCreate({ disciplines, difficulty_levels }: Props) {
    const { generateSlug, slugManuallyEdited } = useSlug();

    const form = useForm({
        title: '',
        slug: '',
        discipline_id: '',
        parent_topic_id: null as string | null,
        difficulty_level: '' as TopicDifficulty | '',
        summary: '',
        content: null as TiptapJSON | null,
        content_plain: '',
        estimated_read_minutes: '' as number | '',
        is_published: false,
        prerequisites: [] as TopicPrerequisite[],
    });

    function handleTitleBlur() {
        if (!slugManuallyEdited.current) {
            form.setData('slug', generateSlug(form.data.title));
        }
    }

    function handleSlugChange(value: string) {
        slugManuallyEdited.current = true;
        form.setData('slug', value);
    }

    async function handleImageUpload(_file: File): Promise<string> {
        return '/placeholder-image.png';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(CanonicalTopicController.store.url());
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Topic" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-bold tracking-tight">Create Topic</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Content</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                value={form.data.title}
                                                onChange={(e) => form.setData('title', e.target.value)}
                                                onBlur={handleTitleBlur}
                                                placeholder="e.g. Introduction to Calculus"
                                            />
                                            <InputError message={form.errors.title} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="slug">Slug</Label>
                                            <Input
                                                id="slug"
                                                value={form.data.slug}
                                                onChange={(e) => handleSlugChange(e.target.value)}
                                                placeholder="e.g. introduction-to-calculus"
                                            />
                                            <InputError message={form.errors.slug} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="summary">Summary</Label>
                                        <Textarea
                                            id="summary"
                                            value={form.data.summary}
                                            onChange={(e) => form.setData('summary', e.target.value)}
                                            placeholder="A brief summary of the topic..."
                                            rows={3}
                                        />
                                        <InputError message={form.errors.summary} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Content</Label>
                                        <TiptapEditor
                                            value={form.data.content}
                                            onChange={(json, plain) => {
                                                form.setData((prev) => ({
                                                    ...prev,
                                                    content: json,
                                                    content_plain: plain,
                                                }));
                                            }}
                                            onImageUpload={handleImageUpload}
                                            placeholder="Write the topic content here..."
                                        />
                                        <InputError message={form.errors.content} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Alert>
                                <Info className="size-4" />
                                <AlertTitle>Prerequisites</AlertTitle>
                                <AlertDescription>
                                    Prerequisites can be managed after saving the topic. Create the topic first, then add prerequisites from the edit page.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <div className="flex flex-col gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="discipline_id">Discipline</Label>
                                        <Select
                                            value={form.data.discipline_id}
                                            onValueChange={(value) => form.setData('discipline_id', value)}
                                        >
                                            <SelectTrigger id="discipline_id">
                                                <SelectValue placeholder="Select discipline" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {disciplines.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.discipline_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="parent_topic_id">Parent Topic</Label>
                                        <Select disabled>
                                            <SelectTrigger id="parent_topic_id">
                                                <SelectValue placeholder="Select parent topic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Save the topic first to assign a parent from the same discipline.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="difficulty_level">Difficulty</Label>
                                        <Select
                                            value={form.data.difficulty_level}
                                            onValueChange={(value) => form.setData('difficulty_level', value as TopicDifficulty)}
                                        >
                                            <SelectTrigger id="difficulty_level">
                                                <SelectValue placeholder="Select difficulty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {difficulty_levels.map((level) => (
                                                    <SelectItem key={level.value} value={level.value}>
                                                        {level.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.difficulty_level} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="estimated_read_minutes">Estimated Read Time (minutes)</Label>
                                        <Input
                                            id="estimated_read_minutes"
                                            type="number"
                                            min={1}
                                            value={form.data.estimated_read_minutes}
                                            onChange={(e) => form.setData('estimated_read_minutes', e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="e.g. 15"
                                        />
                                        <InputError message={form.errors.estimated_read_minutes} />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="is_published"
                                            checked={form.data.is_published}
                                            onCheckedChange={(checked) => form.setData('is_published', checked)}
                                        />
                                        <Label htmlFor="is_published">Published</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href={CanonicalTopicController.index.url()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Create Topic
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
