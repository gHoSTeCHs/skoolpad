import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Save, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import CourseMappingController from '@/actions/App/Http/Controllers/Admin/CourseMappingController';
import CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
import { SortableMappingItem } from '@/components/admin/courses/sortable-mapping-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';
import type { AvailableMappingTopic, MappedTopic, MappingPayload, TopicWeight, WeightOption } from '@/types/mappings';

const difficultyLabels: Record<string, string> = {
    foundational: 'Foundational',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
};

const difficultyStyles: Record<string, string> = {
    foundational: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    intermediate: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    advanced: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

interface CourseInfo {
    id: string;
    course_code: string;
    course_title: string;
    discipline: { id: string; name: string };
    institution: { name: string };
}

interface Props {
    course: CourseInfo;
    mapped_topics: MappedTopic[];
    available_topics: AvailableMappingTopic[];
    weight_options: WeightOption[];
}

export default function AdminCourseMappings({ course, mapped_topics, available_topics, weight_options }: Props) {
    const [mappedTopics, setMappedTopics] = useState<MappedTopic[]>(mapped_topics);
    const [availableTopics, setAvailableTopics] = useState<AvailableMappingTopic[]>(available_topics);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: 'Courses', href: '/admin/courses' },
        { title: 'Edit', href: CourseController.edit.url(course.id) },
        { title: 'Topic Mappings', href: '#' },
    ];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const sortableIds = useMemo(() => mappedTopics.map((t) => t.canonical_topic_id), [mappedTopics]);

    const filteredAvailable = useMemo(() => {
        if (!search.trim()) return availableTopics;
        const term = search.toLowerCase();
        return availableTopics.filter((t) => t.title.toLowerCase().includes(term));
    }, [availableTopics, search]);

    function handleAdd(topic: AvailableMappingTopic) {
        setAvailableTopics((prev) => prev.filter((t) => t.id !== topic.id));
        setMappedTopics((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                canonical_topic_id: topic.id,
                title: topic.title,
                difficulty_level: topic.difficulty_level,
                sequence_order: prev.length + 1,
                weight: 'core' as TopicWeight,
            },
        ]);
    }

    function handleRemove(canonicalTopicId: string) {
        const removed = mappedTopics.find((t) => t.canonical_topic_id === canonicalTopicId);
        if (!removed) return;

        setMappedTopics((prev) =>
            prev
                .filter((t) => t.canonical_topic_id !== canonicalTopicId)
                .map((t, i) => ({ ...t, sequence_order: i + 1 })),
        );
        setAvailableTopics((prev) =>
            [...prev, { id: removed.canonical_topic_id, title: removed.title, difficulty_level: removed.difficulty_level }]
                .sort((a, b) => a.title.localeCompare(b.title)),
        );
    }

    function handleWeightChange(canonicalTopicId: string, weight: TopicWeight) {
        setMappedTopics((prev) =>
            prev.map((t) => (t.canonical_topic_id === canonicalTopicId ? { ...t, weight } : t)),
        );
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setMappedTopics((prev) => {
            const oldIndex = prev.findIndex((t) => t.canonical_topic_id === active.id);
            const newIndex = prev.findIndex((t) => t.canonical_topic_id === over.id);
            return arrayMove(prev, oldIndex, newIndex).map((t, i) => ({ ...t, sequence_order: i + 1 }));
        });
    }

    function handleSave() {
        setProcessing(true);
        const mappings: MappingPayload[] = mappedTopics.map((t) => ({
            canonical_topic_id: t.canonical_topic_id,
            sequence_order: t.sequence_order,
            weight: t.weight,
        }));

        router.put(
            CourseMappingController.update.url(course.id),
            { mappings },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Topic Mappings — ${course.course_code}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
                        <Link href={CourseController.edit.url(course.id)}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            Syllabus for {course.course_code} — {course.course_title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {course.discipline.name} · {course.institution.name}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Available Topics</CardTitle>
                            <div className="relative mt-2">
                                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search topics..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
                                {filteredAvailable.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        {availableTopics.length === 0
                                            ? 'All topics have been mapped.'
                                            : 'No topics match your search.'}
                                    </p>
                                )}
                                {filteredAvailable.map((topic) => (
                                    <div
                                        key={topic.id}
                                        className="flex items-center gap-2 rounded-lg border px-3 py-2"
                                    >
                                        <span className="min-w-0 flex-1 truncate text-sm">
                                            {topic.title}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 border-transparent ${difficultyStyles[topic.difficulty_level] ?? ''}`}
                                        >
                                            {difficultyLabels[topic.difficulty_level] ?? topic.difficulty_level}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 shrink-0"
                                            onClick={() => handleAdd(topic)}
                                        >
                                            <Plus className="size-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Syllabus
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    {mappedTopics.length} topic{mappedTopics.length !== 1 ? 's' : ''} mapped
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
                                {mappedTopics.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No topics mapped yet. Add topics from the available list.
                                    </p>
                                )}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                                        {mappedTopics.map((mapping) => (
                                            <SortableMappingItem
                                                key={mapping.canonical_topic_id}
                                                mapping={mapping}
                                                weightOptions={weight_options}
                                                onWeightChange={handleWeightChange}
                                                onRemove={handleRemove}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-muted/50 sticky bottom-0 flex items-center justify-between rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                        {mappedTopics.length} topic{mappedTopics.length !== 1 ? 's' : ''} mapped
                    </p>
                    <Button onClick={handleSave} disabled={processing}>
                        {processing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Save Mappings
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
