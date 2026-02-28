import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Loader2, Plus, Save, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import CurriculumMappingController from '@/actions/App/Http/Controllers/Admin/CurriculumMappingController';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';
import type { SharedData } from '@/types';

interface EducationLevel {
    id: string;
    name: string;
    display_name: string | null;
    sort_order: number;
}

interface CurriculumTier {
    id: string;
    name: string;
    sort_order: number;
    education_levels: EducationLevel[];
}

interface CurriculumSubject {
    id: string;
    name: string;
    slug: string;
    discipline?: { id: string; name: string } | null;
}

interface StreamOption {
    id: string;
    name: string;
}

interface EducationSystemOption {
    id: string;
    name: string;
    curriculum_tiers: CurriculumTier[];
    curriculum_subjects: CurriculumSubject[];
    streams: StreamOption[];
}

interface SelectOption {
    value: string;
    label: string;
}

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
}

interface Props {
    educationSystems: EducationSystemOption[];
    teachingDepths: SelectOption[];
}

const breadcrumbs = [{ title: 'Curriculum Mappings', href: '/admin/curriculum-mappings' }];

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

export default function AdminCurriculumMappings({ educationSystems, teachingDepths }: Props) {
    const { flash } = usePage<SharedData>().props;

    const [selectedSystemId, setSelectedSystemId] = useState<string>('');
    const [selectedTierId, setSelectedTierId] = useState<string>('');
    const [selectedLevelId, setSelectedLevelId] = useState<string>('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedStreamId, setSelectedStreamId] = useState<string>('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [levelSubjectId, setLevelSubjectId] = useState<string>('');

    const [mappedBlocks, setMappedBlocks] = useState<MappedBlock[]>([]);
    const [topics, setTopics] = useState<TopicWithBlocks[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState<string>('');
    const [search, setSearch] = useState('');

    const selectedSystem = educationSystems.find((s) => s.id === selectedSystemId);
    const availableTiers = selectedSystem?.curriculum_tiers ?? [];
    const selectedTier = availableTiers.find((t) => t.id === selectedTierId);
    const availableLevels = selectedTier?.education_levels ?? [];
    const availableSubjects = selectedSystem?.curriculum_subjects ?? [];
    const availableStreams = selectedSystem?.streams ?? [];
    const hasStreams = availableStreams.length > 0;

    const canLoad =
        selectedLevelId !== '' &&
        selectedSubjectId !== '' &&
        (!hasStreams || selectedStreamId !== '');

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

    function handleSystemChange(value: string) {
        setSelectedSystemId(value);
        setSelectedTierId('');
        setSelectedLevelId('');
        setSelectedSubjectId('');
        setSelectedStreamId('');
        setIsLoaded(false);
        setMappedBlocks([]);
        setTopics([]);
    }

    function handleTierChange(value: string) {
        setSelectedTierId(value);
        setSelectedLevelId('');
    }

    function handleLoad() {
        if (!canLoad) return;

        setIsLoading(true);
        setIsLoaded(false);

        fetch(CurriculumMappingController.load.url(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie
                        .split('; ')
                        .find((row) => row.startsWith('XSRF-TOKEN='))
                        ?.split('=')[1] ?? '',
                ),
            },
            body: JSON.stringify({
                education_level_id: selectedLevelId,
                curriculum_subject_id: selectedSubjectId,
                stream_id: hasStreams ? selectedStreamId : null,
            }),
        })
            .then((res) => res.json())
            .then((data: { level_subject_id: string; mappings: MappedBlock[]; topics: TopicWithBlocks[] }) => {
                setLevelSubjectId(data.level_subject_id);
                setMappedBlocks(data.mappings);
                setTopics(data.topics);
                setSelectedTopicId(data.topics[0]?.id ?? '');
                setIsLoaded(true);
            })
            .catch(() => {
                setIsLoaded(false);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

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
                teaching_depth: teachingDepths[0]?.value ?? 'introductory',
                is_core_block: true,
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
        setIsSaving(true);
        router.put(
            CurriculumMappingController.update.url(),
            {
                curriculum_subject_level_id: levelSubjectId,
                mappings: mappedBlocks.map((block) => ({
                    content_block_id: block.content_block_id,
                    teaching_depth: block.teaching_depth,
                    is_core_block: block.is_core_block,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            },
        );
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Curriculum Mappings" />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Curriculum Block Mappings"
                    description="Map content blocks to curriculum subjects at each education level."
                />

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Education System</label>
                                <Select value={selectedSystemId} onValueChange={handleSystemChange}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select system" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {educationSystems.map((sys) => (
                                            <SelectItem key={sys.id} value={sys.id}>
                                                {sys.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSystemId && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Tier</label>
                                    <Select value={selectedTierId} onValueChange={handleTierChange}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select tier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTiers.map((tier) => (
                                                <SelectItem key={tier.id} value={tier.id}>
                                                    {tier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedTierId && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Level</label>
                                    <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableLevels.map((level) => (
                                                <SelectItem key={level.id} value={level.id}>
                                                    {level.display_name ?? level.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedSystemId && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Select subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSubjects.map((subject) => (
                                                <SelectItem key={subject.id} value={subject.id}>
                                                    {subject.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {hasStreams && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Stream</label>
                                    <Select value={selectedStreamId} onValueChange={setSelectedStreamId}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select stream" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableStreams.map((stream) => (
                                                <SelectItem key={stream.id} value={stream.id}>
                                                    {stream.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button onClick={handleLoad} disabled={!canLoad || isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {flash.success && (
                    <div
                        className="flex items-start gap-3 rounded-lg border px-4 py-3"
                        style={{
                            borderColor: 'var(--badge-primary-fg)',
                            backgroundColor: 'var(--badge-primary-bg)',
                        }}
                    >
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0"
                            style={{ color: 'var(--badge-primary-fg)' }}
                        />
                        <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--badge-primary-fg)' }}
                        >
                            {flash.success}
                        </p>
                    </div>
                )}

                {isLoaded && (
                    <>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Available Blocks</CardTitle>
                                    <div className="mt-2 space-y-2">
                                        <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
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
                                        {topics.length === 0 && (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No published topics with blocks found for this subject's discipline.
                                            </p>
                                        )}
                                        {topics.length > 0 && !selectedTopicId && (
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
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                                Save Mappings
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
