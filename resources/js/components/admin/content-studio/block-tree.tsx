import { useMemo, useState } from 'react';
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { BlockTreeNode } from '@/components/admin/content-studio/block-tree-node';
import type { BlockNode } from '@/types/content-studio';

interface BlockTreeProps {
    blocks: BlockNode[];
    onChange: (updated: BlockNode[]) => void;
    readOnly?: boolean;
}

function getChildIndices(blocks: BlockNode[], parentIndex: number | null): number[] {
    return blocks
        .map((b, i) => ({ block: b, index: i }))
        .filter((item) => item.block.parent_index === parentIndex)
        .sort((a, b) => a.block.sort_order - b.block.sort_order)
        .map((item) => item.index);
}

function isDescendant(blocks: BlockNode[], blockIndex: number, ancestorIndex: number): boolean {
    let current = blocks[blockIndex]?.parent_index;
    while (current !== null && current !== undefined) {
        if (current === ancestorIndex) return true;
        current = blocks[current]?.parent_index;
    }
    return false;
}

export function BlockTree({ blocks, onChange, readOnly = false }: BlockTreeProps) {
    const [collapsedIndices, setCollapsedIndices] = useState<Set<number>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const visibleBlocks = useMemo(() => {
        const result: { block: BlockNode; index: number; depth: number }[] = [];

        function walk(parentIndex: number | null, depth: number) {
            const children = getChildIndices(blocks, parentIndex);
            for (const idx of children) {
                result.push({ block: blocks[idx], index: idx, depth });
                if (blocks[idx].is_container && !collapsedIndices.has(idx)) {
                    walk(idx, depth + 1);
                }
            }
        }

        walk(null, 0);
        return result;
    }, [blocks, collapsedIndices]);

    const siblingGroups = useMemo(() => {
        const groups = new Map<string, number[]>();
        for (const item of visibleBlocks) {
            const key = String(item.block.parent_index ?? 'root');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(item.index);
        }
        return groups;
    }, [visibleBlocks]);

    const allSortableIds = useMemo(
        () => visibleBlocks.map((item) => `block-${item.index}`),
        [visibleBlocks],
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeIdx = parseInt((active.id as string).replace('block-', ''));
        const overIdx = parseInt((over.id as string).replace('block-', ''));

        const activeParent = blocks[activeIdx]?.parent_index;
        const overParent = blocks[overIdx]?.parent_index;
        if (activeParent !== overParent) return;

        const parentKey = String(activeParent ?? 'root');
        const siblings = siblingGroups.get(parentKey);
        if (!siblings) return;

        const oldPos = siblings.indexOf(activeIdx);
        const newPos = siblings.indexOf(overIdx);
        if (oldPos === -1 || newPos === -1) return;

        const reordered = arrayMove(siblings, oldPos, newPos);

        const updated = blocks.map((b) => ({ ...b }));
        reordered.forEach((blockIdx, sortPos) => {
            updated[blockIdx] = { ...updated[blockIdx], sort_order: sortPos + 1 };
        });

        onChange(updated);
    }

    function handleUpdate(index: number, field: string, value: unknown) {
        const updated = blocks.map((b, i) => (i === index ? { ...b, [field]: value } : b));
        onChange(updated);
    }

    function handleDelete(index: number) {
        const indicesToRemove = new Set<number>([index]);
        for (let i = 0; i < blocks.length; i++) {
            if (isDescendant(blocks, i, index)) {
                indicesToRemove.add(i);
            }
        }

        const indexMap = new Map<number, number>();
        let newIdx = 0;
        for (let i = 0; i < blocks.length; i++) {
            if (!indicesToRemove.has(i)) {
                indexMap.set(i, newIdx);
                newIdx++;
            }
        }

        const updated = blocks
            .filter((_, i) => !indicesToRemove.has(i))
            .map((b) => ({
                ...b,
                parent_index: b.parent_index !== null && indexMap.has(b.parent_index)
                    ? indexMap.get(b.parent_index)!
                    : b.parent_index !== null && !indexMap.has(b.parent_index)
                        ? null
                        : b.parent_index,
            }));

        onChange(updated);
    }

    function toggleExpand(index: number) {
        setCollapsedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }

    function hasChildren(index: number): boolean {
        return blocks.some((b) => b.parent_index === index);
    }

    if (blocks.length === 0) {
        return (
            <div className="flex items-center justify-center rounded-md border border-dashed py-8 text-sm text-muted-foreground/60">
                No blocks generated yet
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={allSortableIds}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-px">
                    {visibleBlocks.map((item) => (
                        <BlockTreeNode
                            key={`block-${item.index}`}
                            id={`block-${item.index}`}
                            node={item.block}
                            index={item.index}
                            depth={item.depth}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            readOnly={readOnly}
                            isExpanded={!collapsedIndices.has(item.index)}
                            onToggleExpand={() => toggleExpand(item.index)}
                            hasChildren={hasChildren(item.index)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
