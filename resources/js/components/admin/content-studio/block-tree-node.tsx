import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BlockNode, BlockType, BloomLevel } from '@/types/content-studio';

interface BlockTreeNodeProps {
    node: BlockNode;
    index: number;
    depth: number;
    id: string;
    onUpdate: (index: number, field: string, value: unknown) => void;
    onDelete: (index: number) => void;
    readOnly?: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    hasChildren: boolean;
}

const BLOCK_TYPE_STYLES: Record<BlockType, string> = {
    container: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    text: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 reader:bg-slate-800/40 reader:text-slate-300',
    code: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 reader:bg-purple-900/40 reader:text-purple-300',
    diagram: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 reader:bg-pink-900/40 reader:text-pink-300',
    example: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    exercise: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300',
    quiz: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 reader:bg-orange-900/40 reader:text-orange-300',
    reference: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 reader:bg-teal-900/40 reader:text-teal-300',
    comparison: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 reader:bg-indigo-900/40 reader:text-indigo-300',
};

const BLOOM_LABELS: Record<BloomLevel, string> = {
    remember: 'Rem',
    understand: 'Und',
    apply: 'App',
    analyze: 'Ana',
    evaluate: 'Eva',
    create: 'Cre',
};

export function BlockTreeNode({
    node,
    index,
    depth,
    id,
    onUpdate,
    onDelete,
    readOnly = false,
    isExpanded,
    onToggleExpand,
    hasChildren,
}: BlockTreeNodeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: readOnly });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: `${depth * 20}px`,
    };

    function handleTitleChange(value: string) {
        onUpdate(index, 'title', value);
    }

    function handleDelete() {
        if (hasChildren && !confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        onDelete(index);
        setConfirmDelete(false);
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex min-h-8 items-center gap-1 rounded-sm pr-1 transition-shadow ${
                isDragging ? 'z-50 bg-card opacity-90 shadow-lg ring-1 ring-primary/20' : 'hover:bg-muted/40'
            } ${node.is_container ? 'font-medium' : ''}`}
        >
            {node.is_container ? (
                <button
                    type="button"
                    onClick={onToggleExpand}
                    className="flex size-5 shrink-0 items-center justify-center text-muted-foreground/60 hover:text-muted-foreground"
                >
                    {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
            ) : (
                <span className="size-5 shrink-0" />
            )}

            {!readOnly && (
                <button
                    type="button"
                    className="shrink-0 touch-none cursor-grab text-muted-foreground/30 hover:text-muted-foreground/60 active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-3.5" />
                </button>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {isEditing && !readOnly ? (
                    <Input
                        value={node.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                        className="h-6 flex-1 border-none bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
                        autoFocus
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => !readOnly && setIsEditing(true)}
                        className={`min-w-0 truncate text-left text-xs ${readOnly ? '' : 'cursor-text'}`}
                    >
                        {node.title}
                    </button>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Badge variant="secondary" className={`px-1 py-0 text-[10px] leading-tight ${BLOCK_TYPE_STYLES[node.block_type]}`}>
                    {node.block_type}
                </Badge>

                {node.bloom_level && (
                    <span className="rounded bg-muted px-1 py-0 text-[9px] text-muted-foreground">
                        {BLOOM_LABELS[node.bloom_level]}
                    </span>
                )}

                {node.estimated_read_time && (
                    <span className="text-[10px] text-muted-foreground/60">
                        {node.estimated_read_time}m
                    </span>
                )}

                {node.visualization?.recommended && (
                    <Sparkles className="size-3 text-[var(--warning)]" />
                )}

                {!readOnly && (
                    <>
                        {confirmDelete ? (
                            <div className="flex items-center gap-0.5">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-5 px-1.5 text-[10px]"
                                    onClick={handleDelete}
                                >
                                    Confirm
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 px-1 text-[10px]"
                                    onClick={() => setConfirmDelete(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="invisible text-muted-foreground/40 hover:text-destructive group-hover:visible"
                            >
                                <Trash2 className="size-3" />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
