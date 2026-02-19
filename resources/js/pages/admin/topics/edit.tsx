import { Head, Link, useForm } from '@inertiajs/react';
import CanonicalTopicController from '@/actions/App/Http/Controllers/Admin/CanonicalTopicController';
import { PrerequisiteManager } from '@/components/admin/topics/prerequisite-manager';
import InputError from '@/components/input-error';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import type { TiptapJSON } from '@/types/tiptap';
import type {
    AvailableTopic,
    DifficultyOption,
    Discipline,
    TopicDifficulty,
    TopicPrerequisite,
} from '@/types/topics';

interface TopicData {
    id: string;
    title: string;
    slug: string;
    discipline_id: string;
    parent_topic_id: string | null;
    difficulty_level: TopicDifficulty;
    content: TiptapJSON | null;
    content_plain: string | null;
    summary: string | null;
    estimated_read_minutes: number | null;
    is_published: boolean;
    prerequisites: TopicPrerequisite[];
}

interface Props {
    topic: TopicData;
    disciplines: Discipline[];
    difficulty_levels: DifficultyOption[];
    available_topics: AvailableTopic[];
}

const breadcrumbs = [
    { title: 'Topics', href: '/admin/topics' },
    { title: 'Edit', href: '#' },
];

const NONE_VALUE = '__none__';

export default function AdminTopicsEdit({ topic, disciplines, difficulty_levels, available_topics }: Props) {
    const form = useForm({
        title: topic.title,
        slug: topic.slug,
        discipline_id: topic.discipline_id,
        parent_topic_id: topic.parent_topic_id as string | null,
        difficulty_level: topic.difficulty_level as TopicDifficulty | '',
        summary: topic.summary ?? '',
        content: topic.content as TiptapJSON | null,
        content_plain: topic.content_plain ?? '',
        estimated_read_minutes: (topic.estimated_read_minutes ?? '') as number | '',
        is_published: topic.is_published,
        prerequisites: topic.prerequisites as TopicPrerequisite[],
    });

    async function handleImageUpload(_file: File): Promise<string> {
        return '/placeholder-image.png';
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.put(CanonicalTopicController.update.url(topic.id));
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Topic" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-2xl font-bold tracking-tight">Edit Topic</h1>
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
                                                placeholder="e.g. Introduction to Calculus"
                                            />
                                            <InputError message={form.errors.title} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="slug">Slug</Label>
                                            <Input
                                                id="slug"
                                                value={form.data.slug}
                                                onChange={(e) => form.setData('slug', e.target.value)}
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

                            <PrerequisiteManager
                                topicId={topic.id}
                                disciplineTopics={available_topics}
                                currentPrerequisites={form.data.prerequisites}
                                onChange={(updated) => form.setData('prerequisites', updated)}
                            />
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
                                        <Select
                                            value={form.data.parent_topic_id ?? NONE_VALUE}
                                            onValueChange={(value) => form.setData('parent_topic_id', value === NONE_VALUE ? null : value)}
                                        >
                                            <SelectTrigger id="parent_topic_id">
                                                <SelectValue placeholder="Select parent topic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={NONE_VALUE}>None</SelectItem>
                                                {available_topics.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.parent_topic_id} />
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
                            Update Topic
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
