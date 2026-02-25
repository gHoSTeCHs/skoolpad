import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Save, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import CourseBlockMappingController from '@/actions/App/Http/Controllers/Admin/CourseBlockMappingController';
import CourseController from '@/actions/App/Http/Controllers/Admin/CourseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';

interface TopicBlock {
    id: string;
    title: string;
    path: string;
    block_type: string;
    is_container: boolean;
}

interface TopicWithBlocks {
    id: string;
    title: string;
    blocks: TopicBlock[];
}

interface MappedBlock {
    id: string;
    content_block_id: string;
    block_title: string;
    block_path: string;
    block_type: string;
    is_container: boolean;
    teaching_depth: string;
    is_core_block: boolean;
    week_start: number | null;
    week_end: number | null;
    lecture_hours: number | null;
    lab_hours: number | null;
}

interface SelectOption {
    value: string;
    label: string;
}

interface CourseInfo {
    id: string;
    course_code: string;
    course_title: string;
    discipline: { id: string; name: string };
    institution: { name: string };
}

interface Props {
    course: CourseInfo;
    mappings: MappedBlock[];
    topics: TopicWithBlocks[];
    teachingDepths: SelectOption[];
}

const blockTypeStyles: Record<string, string> = {
    chapter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    section: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 reader:bg-purple-900/30 reader:text-purple-400',
    lesson: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    exercise: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    assessment: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

function formatBlockType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function AdminCourseBlockMappings({ course, mappings, topics, teachingDepths }: Props) {
    const [mappedBlocks, setMappedBlocks] = useState<MappedBlock[]>(mappings);
    const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id ?? '');
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: 'Courses', href: '/admin/courses' },
        { title: 'Edit', href: CourseController.edit.url(course.id) },
        { title: 'Block Mappings', href: '#' },
    ];

    const mappedBlockIds = useMemo(
        () => new Set(mappedBlocks.map((b) => b.content_block_id)),
        [mappedBlocks],
    );

    const selectedTopic = useMemo(
        () => topics.find((t) => t.id === selectedTopicId),
        [topics, selectedTopicId],
    );

    const filteredBlocks = useMemo(() => {
        if (!selectedTopic) return [];
        let blocks = selectedTopic.blocks.filter((b) => !mappedBlockIds.has(b.id));
        if (search.trim()) {
            const term = search.toLowerCase();
            blocks = blocks.filter(
                (b) => b.title.toLowerCase().includes(term) || b.path.toLowerCase().includes(term),
            );
        }
        return blocks;
    }, [selectedTopic, mappedBlockIds, search]);

    function handleAdd(block: TopicBlock) {
        setMappedBlocks((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                content_block_id: block.id,
                block_title: block.title,
                block_path: block.path,
                block_type: block.block_type,
                is_container: block.is_container,
                teaching_depth: teachingDepths[0]?.value ?? 'overview',
                is_core_block: true,
                week_start: null,
                week_end: null,
                lecture_hours: null,
                lab_hours: null,
            },
        ]);
    }

    function handleRemove(blockId: string) {
        setMappedBlocks((prev) => prev.filter((b) => b.id !== blockId));
    }

    function handleFieldChange<K extends keyof MappedBlock>(id: string, field: K, value: MappedBlock[K]) {
        setMappedBlocks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
        );
    }

    function handleSave() {
        setProcessing(true);
        const payload = {
            mappings: mappedBlocks.map((block) => ({
                content_block_id: block.content_block_id,
                teaching_depth: block.teaching_depth,
                is_core_block: block.is_core_block,
                week_start: block.week_start,
                week_end: block.week_end,
                lecture_hours: block.lecture_hours,
                lab_hours: block.lab_hours,
            })),
        };

        router.put(
            CourseBlockMappingController.update.url(course.id),
            payload,
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Block Mappings — ${course.course_code}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
                        <Link href={CourseController.edit.url(course.id)}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            Block Mappings for {course.course_code} — {course.course_title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {course.discipline.name} · {course.institution.name}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Available Blocks</CardTitle>
                            <div className="mt-2 space-y-2">
                                <Select
                                    value={selectedTopicId}
                                    onValueChange={setSelectedTopicId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a topic" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {topics.map((topic) => (
                                            <SelectItem key={topic.id} value={topic.id}>
                                                {topic.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search blocks..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
                                {!selectedTopicId && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        Select a topic to see its blocks.
                                    </p>
                                )}
                                {selectedTopicId && filteredBlocks.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        {search.trim()
                                            ? 'No blocks match your search.'
                                            : 'All blocks from this topic have been mapped.'}
                                    </p>
                                )}
                                {filteredBlocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="flex items-center gap-2 rounded-lg border px-3 py-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="block truncate text-sm">{block.title}</span>
                                            <span className="block truncate text-xs text-muted-foreground">{block.path}</span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`shrink-0 border-transparent ${blockTypeStyles[block.block_type] ?? ''}`}
                                        >
                                            {formatBlockType(block.block_type)}
                                        </Badge>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 shrink-0"
                                            onClick={() => handleAdd(block)}
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
                                Mapped Blocks
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    {mappedBlocks.length} block{mappedBlocks.length !== 1 ? 's' : ''} mapped
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                                {mappedBlocks.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No blocks mapped yet. Add blocks from the available list.
                                    </p>
                                )}
                                {mappedBlocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="space-y-3 rounded-lg border p-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-medium">{block.block_title}</span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`shrink-0 border-transparent ${blockTypeStyles[block.block_type] ?? ''}`}
                                                    >
                                                        {formatBlockType(block.block_type)}
                                                    </Badge>
                                                </div>
                                                <span className="block truncate text-xs text-muted-foreground">{block.block_path}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemove(block.id)}
                                            >
                                                <X className="size-3.5" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`depth-${block.id}`} className="text-xs">Teaching Depth</Label>
                                                <Select
                                                    value={block.teaching_depth}
                                                    onValueChange={(v) => handleFieldChange(block.id, 'teaching_depth', v)}
                                                >
                                                    <SelectTrigger id={`depth-${block.id}`} className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teachingDepths.map((opt) => (
                                                            <SelectItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-end gap-2 pb-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        id={`core-${block.id}`}
                                                        size="sm"
                                                        checked={block.is_core_block}
                                                        onCheckedChange={(v) => handleFieldChange(block.id, 'is_core_block', v)}
                                                    />
                                                    <Label htmlFor={`core-${block.id}`} className="text-xs">Core Block</Label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`ws-${block.id}`} className="text-xs">Week Start</Label>
                                                <Input
                                                    id={`ws-${block.id}`}
                                                    type="number"
                                                    min={1}
                                                    className="h-8 text-xs"
                                                    value={block.week_start ?? ''}
                                                    onChange={(e) => handleFieldChange(
                                                        block.id,
                                                        'week_start',
                                                        e.target.value ? Number(e.target.value) : null,
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`we-${block.id}`} className="text-xs">Week End</Label>
                                                <Input
                                                    id={`we-${block.id}`}
                                                    type="number"
                                                    min={1}
                                                    className="h-8 text-xs"
                                                    value={block.week_end ?? ''}
                                                    onChange={(e) => handleFieldChange(
                                                        block.id,
                                                        'week_end',
                                                        e.target.value ? Number(e.target.value) : null,
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`lh-${block.id}`} className="text-xs">Lecture Hours</Label>
                                                <Input
                                                    id={`lh-${block.id}`}
                                                    type="number"
                                                    min={0}
                                                    step="0.5"
                                                    className="h-8 text-xs"
                                                    value={block.lecture_hours ?? ''}
                                                    onChange={(e) => handleFieldChange(
                                                        block.id,
                                                        'lecture_hours',
                                                        e.target.value ? Number(e.target.value) : null,
                                                    )}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`labh-${block.id}`} className="text-xs">Lab Hours</Label>
                                                <Input
                                                    id={`labh-${block.id}`}
                                                    type="number"
                                                    min={0}
                                                    step="0.5"
                                                    className="h-8 text-xs"
                                                    value={block.lab_hours ?? ''}
                                                    onChange={(e) => handleFieldChange(
                                                        block.id,
                                                        'lab_hours',
                                                        e.target.value ? Number(e.target.value) : null,
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-muted/50 sticky bottom-0 flex items-center justify-between rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                        {mappedBlocks.length} block{mappedBlocks.length !== 1 ? 's' : ''} mapped
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
