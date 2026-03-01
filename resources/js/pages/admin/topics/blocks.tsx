import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, MoreHorizontal, Plus, TreePine } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ContentBlockController from '@/actions/App/Http/Controllers/Admin/ContentBlockController';
import CanonicalTopicController from '@/actions/App/Http/Controllers/Admin/CanonicalTopicController';
import { PrerequisiteManager } from '@/components/admin/topics/prerequisite-manager';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { BlockTypeIcon, DifficultyBadge } from '@/components/skoolpad/block-tree';
import SpBadge from '@/components/skoolpad/sp-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormField } from '@/components/ui/form-field';
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
import { useSlug } from '@/hooks/use-slug';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type { TiptapJSON } from '@/types/tiptap';
import type { TopicPrerequisite } from '@/types/topics';

interface BlockNode {
    id: string;
    parent_block_id: string | null;
    title: string;
    slug: string;
    block_type: string;
    block_type_label: string;
    path: string;
    depth_level: number;
    sort_order: number;
    content: Record<string, unknown> | null;
    estimated_read_time: number | null;
    difficulty_level: string | null;
    bloom_level: string | null;
    is_container: boolean;
    is_published: boolean;
    prerequisites: Array<{ id: string; title: string; is_hard_prerequisite: boolean }>;
    children: BlockNode[];
}

interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    topic: { id: string; title: string; slug: string };
    blocks: BlockNode[];
    blockTypes: SelectOption[];
    difficultyLevels: SelectOption[];
    bloomLevels: SelectOption[];
    availableBlocks: Array<{ id: string; title: string }>;
}

const NONE_VALUE = '__none__';

function findBlockById(blocks: BlockNode[], id: string): BlockNode | null {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children.length > 0) {
            const found = findBlockById(block.children, id);
            if (found) return found;
        }
    }
    return null;
}

interface TreeNodeProps {
    node: BlockNode;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAddChild: (parentId: string) => void;
    onTogglePublish: (id: string) => void;
    onDelete: (id: string) => void;
    defaultExpanded: boolean;
    depth?: number;
}

function TreeNode({
    node,
    selectedId,
    onSelect,
    onAddChild,
    onTogglePublish,
    onDelete,
    defaultExpanded,
    depth = 0,
}: TreeNodeProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    'group flex cursor-pointer items-center gap-2 border-l-2 px-3 py-[6px] transition-all duration-150',
                    isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-[var(--bg-raised)]',
                )}
                style={{ paddingLeft: `${depth * 20 + 12}px` }}
                onClick={() => onSelect(node.id)}
            >
                {hasChildren || node.is_container ? (
                    <button
                        type="button"
                        className="shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                    >
                        <span
                            className={cn(
                                'inline-block text-[10px] text-muted-foreground transition-transform duration-150',
                                expanded && 'rotate-90',
                            )}
                        >
                            {'\u25B6'}
                        </span>
                    </button>
                ) : (
                    <span className="inline-block w-[10px]" />
                )}

                <BlockTypeIcon type={node.block_type} />

                <span
                    className="min-w-0 flex-1 truncate text-[13px] font-medium"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    {node.path && (
                        <span className="mr-1.5 text-muted-foreground">
                            {node.path}
                        </span>
                    )}
                    {node.title}
                </span>

                {node.estimated_read_time && (
                    <span
                        className="shrink-0 text-[10px] text-muted-foreground"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        {node.estimated_read_time}m
                    </span>
                )}

                <DifficultyBadge level={node.difficulty_level} />

                {!node.is_published && (
                    <SpBadge
                        variant="neutral"
                        className="px-[6px] py-0 text-[9px]"
                    >
                        Draft
                    </SpBadge>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="size-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelect(node.id)}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddChild(node.id)}>
                            Add Child
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onTogglePublish(node.id)}
                        >
                            {node.is_published ? 'Unpublish' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(node.id)}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {expanded && hasChildren && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onAddChild={onAddChild}
                            onTogglePublish={onTogglePublish}
                            onDelete={onDelete}
                            defaultExpanded={false}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface CreateBlockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    topicId: string;
    parentBlockId: string | null;
    blockTypes: SelectOption[];
}

function CreateBlockDialog({
    open,
    onOpenChange,
    topicId,
    parentBlockId,
    blockTypes,
}: CreateBlockDialogProps) {
    const { generateSlug, slugManuallyEdited, resetSlugTracking } = useSlug();
    const form = useForm({
        title: '',
        slug: '',
        block_type: 'text',
        parent_block_id: parentBlockId,
        is_container: false,
    });

    useEffect(() => {
        if (open) {
            form.reset();
            form.setData('parent_block_id', parentBlockId);
            resetSlugTracking();
        }
    }, [open, parentBlockId]);

    function handleTitleChange(value: string) {
        form.setData('title', value);
        if (!slugManuallyEdited.current) {
            form.setData('slug', generateSlug(value));
        }
    }

    function handleSlugChange(value: string) {
        slugManuallyEdited.current = true;
        form.setData('slug', value);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(ContentBlockController.store.url(topicId), {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {parentBlockId ? 'Add Child Block' : 'Add Block'}
                    </DialogTitle>
                    <DialogDescription>
                        Create a new content block
                        {parentBlockId ? ' inside the selected block' : ' at the root level'}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Title"
                        name="create-title"
                        error={form.errors.title}
                        required
                    >
                        <Input
                            id="create-title"
                            value={form.data.title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="e.g. Introduction"
                            autoFocus
                        />
                    </FormField>

                    <FormField
                        label="Slug"
                        name="create-slug"
                        error={form.errors.slug}
                        required
                    >
                        <Input
                            id="create-slug"
                            value={form.data.slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="e.g. introduction"
                        />
                    </FormField>

                    <FormField
                        label="Block Type"
                        name="create-block_type"
                        error={form.errors.block_type}
                        required
                    >
                        <Select
                            value={form.data.block_type}
                            onValueChange={(value) =>
                                form.setData('block_type', value)
                            }
                        >
                            <SelectTrigger id="create-block_type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {blockTypes.map((bt) => (
                                    <SelectItem key={bt.value} value={bt.value}>
                                        {bt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="create-is_container"
                            checked={form.data.is_container}
                            onCheckedChange={(checked) =>
                                form.setData('is_container', checked)
                            }
                        />
                        <Label htmlFor="create-is_container">
                            Is Container (groups child blocks)
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Create Block
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blockTitle: string;
    onConfirm: () => void;
    processing: boolean;
}

function DeleteConfirmDialog({
    open,
    onOpenChange,
    blockTitle,
    onConfirm,
    processing,
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete Block</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &ldquo;{blockTitle}
                        &rdquo;? This will also delete all child blocks. This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface BlockDetailFormProps {
    block: BlockNode;
    topicId: string;
    blockTypes: SelectOption[];
    difficultyLevels: SelectOption[];
    bloomLevels: SelectOption[];
    availableBlocks: Array<{ id: string; title: string }>;
    onDelete: (id: string) => void;
}

function getDescendantIds(block: BlockNode): string[] {
    const ids: string[] = [];
    for (const child of block.children) {
        ids.push(child.id);
        ids.push(...getDescendantIds(child));
    }
    return ids;
}

function BlockDetailForm({
    block,
    topicId,
    blockTypes,
    difficultyLevels,
    bloomLevels,
    availableBlocks,
    onDelete,
}: BlockDetailFormProps) {
    const { generateSlug, slugManuallyEdited, resetSlugTracking } = useSlug();
    const form = useForm({
        title: block.title,
        slug: block.slug,
        block_type: block.block_type,
        difficulty_level: (block.difficulty_level ?? '') as string,
        bloom_level: (block.bloom_level ?? '') as string,
        estimated_read_time: (block.estimated_read_time ?? '') as number | '',
        is_published: block.is_published,
        content: block.content as TiptapJSON | null,
        content_plain: '',
        prerequisites: block.prerequisites as TopicPrerequisite[],
    });

    const prevBlockIdRef = useRef(block.id);

    useEffect(() => {
        if (prevBlockIdRef.current !== block.id) {
            prevBlockIdRef.current = block.id;
            form.setData({
                title: block.title,
                slug: block.slug,
                block_type: block.block_type,
                difficulty_level: block.difficulty_level ?? '',
                bloom_level: block.bloom_level ?? '',
                estimated_read_time: block.estimated_read_time ?? '',
                is_published: block.is_published,
                content: block.content as TiptapJSON | null,
                content_plain: '',
                prerequisites: block.prerequisites as TopicPrerequisite[],
            });
            resetSlugTracking();
        }
    }, [block.id]);

    const filteredAvailableBlocks = useMemo(() => {
        const excludeIds = new Set([block.id, ...getDescendantIds(block)]);
        return availableBlocks.filter((b) => !excludeIds.has(b.id));
    }, [availableBlocks, block]);

    function handleTitleChange(value: string) {
        form.setData('title', value);
        if (!slugManuallyEdited.current) {
            form.setData('slug', generateSlug(value));
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
        form.put(ContentBlockController.update.url(block.id), {
            preserveScroll: true,
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BlockTypeIcon type={block.block_type} />
                    <h3
                        className="font-display text-lg font-semibold"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Edit Block
                    </h3>
                </div>
                <SpBadge variant="neutral" className="px-[6px] py-0 text-[10px]">
                    {block.path}
                </SpBadge>
            </div>

            <FormField
                label="Title"
                name="edit-title"
                error={form.errors.title}
                required
            >
                <Input
                    id="edit-title"
                    value={form.data.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Block title"
                />
            </FormField>

            <FormField
                label="Slug"
                name="edit-slug"
                error={form.errors.slug}
                required
            >
                <Input
                    id="edit-slug"
                    value={form.data.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="block-slug"
                />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label="Block Type"
                    name="edit-block_type"
                    error={form.errors.block_type}
                    required
                >
                    <Select
                        value={form.data.block_type}
                        onValueChange={(value) =>
                            form.setData('block_type', value)
                        }
                    >
                        <SelectTrigger id="edit-block_type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {blockTypes.map((bt) => (
                                <SelectItem key={bt.value} value={bt.value}>
                                    {bt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField
                    label="Difficulty Level"
                    name="edit-difficulty_level"
                    error={form.errors.difficulty_level}
                >
                    <Select
                        value={form.data.difficulty_level || NONE_VALUE}
                        onValueChange={(value) =>
                            form.setData(
                                'difficulty_level',
                                value === NONE_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger id="edit-difficulty_level">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE_VALUE}>None</SelectItem>
                            {difficultyLevels.map((dl) => (
                                <SelectItem key={dl.value} value={dl.value}>
                                    {dl.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label="Bloom Level"
                    name="edit-bloom_level"
                    error={form.errors.bloom_level}
                >
                    <Select
                        value={form.data.bloom_level || NONE_VALUE}
                        onValueChange={(value) =>
                            form.setData(
                                'bloom_level',
                                value === NONE_VALUE ? '' : value,
                            )
                        }
                    >
                        <SelectTrigger id="edit-bloom_level">
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE_VALUE}>None</SelectItem>
                            {bloomLevels.map((bl) => (
                                <SelectItem key={bl.value} value={bl.value}>
                                    {bl.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                {!block.is_container && (
                    <FormField
                        label="Read Time (min)"
                        name="edit-estimated_read_time"
                        error={form.errors.estimated_read_time}
                    >
                        <Input
                            id="edit-estimated_read_time"
                            type="number"
                            min={1}
                            value={form.data.estimated_read_time}
                            onChange={(e) =>
                                form.setData(
                                    'estimated_read_time',
                                    e.target.value === ''
                                        ? ''
                                        : Number(e.target.value),
                                )
                            }
                            placeholder="e.g. 5"
                        />
                    </FormField>
                )}
            </div>

            <div className="flex items-center gap-3">
                <Switch
                    id="edit-is_published"
                    checked={form.data.is_published}
                    onCheckedChange={(checked) =>
                        form.setData('is_published', checked)
                    }
                />
                <Label htmlFor="edit-is_published">Published</Label>
            </div>

            {!block.is_container && (
                <FormField
                    label="Content"
                    name="edit-content"
                    error={form.errors.content as string | undefined}
                >
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
                        placeholder="Write the block content here..."
                    />
                </FormField>
            )}

            <PrerequisiteManager
                topicId={block.id}
                disciplineTopics={filteredAvailableBlocks}
                currentPrerequisites={form.data.prerequisites}
                onChange={(prerequisites) => form.setData('prerequisites', prerequisites)}
            />

            <div className="flex items-center justify-between pt-2">
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(block.id)}
                >
                    Delete Block
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}

export default function AdminTopicBlocks({
    topic,
    blocks,
    blockTypes,
    difficultyLevels,
    bloomLevels,
    availableBlocks,
}: Props) {
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createParentId, setCreateParentId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const breadcrumbs = useMemo(
        () => [
            { title: 'Topics', href: CanonicalTopicController.index.url() },
            {
                title: topic.title,
                href: CanonicalTopicController.edit.url(topic.id),
            },
            { title: 'Blocks', href: '#' },
        ],
        [topic],
    );

    const selectedBlock = useMemo(() => {
        if (!selectedBlockId) return null;
        return findBlockById(blocks, selectedBlockId);
    }, [blocks, selectedBlockId]);

    const deleteBlock = useMemo(() => {
        if (!deleteBlockId) return null;
        return findBlockById(blocks, deleteBlockId);
    }, [blocks, deleteBlockId]);

    const handleAddRoot = useCallback(() => {
        setCreateParentId(null);
        setCreateDialogOpen(true);
    }, []);

    const handleAddChild = useCallback((parentId: string) => {
        setCreateParentId(parentId);
        setCreateDialogOpen(true);
    }, []);

    const handleTogglePublish = useCallback(
        (blockId: string) => {
            const block = findBlockById(blocks, blockId);
            if (!block) return;
            router.put(
                ContentBlockController.update.url(blockId),
                { is_published: !block.is_published },
                { preserveScroll: true },
            );
        },
        [blocks],
    );

    const handleDeleteRequest = useCallback((blockId: string) => {
        setDeleteBlockId(blockId);
        setDeleteDialogOpen(true);
    }, []);

    function handleDeleteConfirm() {
        if (!deleteBlockId) return;
        setDeleteProcessing(true);
        router.delete(ContentBlockController.destroy.url(deleteBlockId), {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedBlockId === deleteBlockId) {
                    setSelectedBlockId(null);
                }
                setDeleteDialogOpen(false);
                setDeleteBlockId(null);
            },
            onFinish: () => setDeleteProcessing(false),
        });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Blocks — ${topic.title}`} />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mt-0.5 shrink-0"
                        asChild
                    >
                        <Link href={CanonicalTopicController.edit.url(topic.id)}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            Content Blocks
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage the content block tree for{' '}
                            <span className="font-medium">{topic.title}</span>
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                    <Card className="flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-base">
                                Block Tree
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    {blocks.length} root block
                                    {blocks.length !== 1 ? 's' : ''}
                                </span>
                            </CardTitle>
                            <Button size="sm" onClick={handleAddRoot}>
                                <Plus className="mr-1.5 size-3.5" />
                                Add Block
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                                {blocks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <TreePine className="size-10 text-muted-foreground/40" />
                                        <p className="mt-3 text-sm font-medium text-muted-foreground">
                                            No blocks yet
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground/70">
                                            Add your first content block to
                                            start building the tree.
                                        </p>
                                    </div>
                                )}
                                {blocks.map((block) => (
                                    <TreeNode
                                        key={block.id}
                                        node={block}
                                        selectedId={selectedBlockId}
                                        onSelect={setSelectedBlockId}
                                        onAddChild={handleAddChild}
                                        onTogglePublish={handleTogglePublish}
                                        onDelete={handleDeleteRequest}
                                        defaultExpanded={true}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)]">
                        <CardContent className="flex-1 overflow-y-auto p-5">
                            {selectedBlock ? (
                                <BlockDetailForm
                                    key={selectedBlock.id}
                                    block={selectedBlock}
                                    topicId={topic.id}
                                    blockTypes={blockTypes}
                                    difficultyLevels={difficultyLevels}
                                    bloomLevels={bloomLevels}
                                    availableBlocks={availableBlocks}
                                    onDelete={handleDeleteRequest}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <TreePine className="size-10 text-muted-foreground/40" />
                                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                                        Select a block to edit
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/70">
                                        Click on any block in the tree to view
                                        and edit its details.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <CreateBlockDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                topicId={topic.id}
                parentBlockId={createParentId}
                blockTypes={blockTypes}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                blockTitle={deleteBlock?.title ?? ''}
                onConfirm={handleDeleteConfirm}
                processing={deleteProcessing}
            />
        </AdminLayout>
    );
}
