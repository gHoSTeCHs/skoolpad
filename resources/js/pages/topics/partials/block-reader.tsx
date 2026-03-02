import { router } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Lock, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TreeNode, type TreeBlock } from '@/components/skoolpad/block-tree/tree-node';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { Button } from '@/components/ui/button';
import { toggleBlockComplete } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { TopicBlock } from '@/types/student-topics';
import type { TiptapJSON } from '@/types/tiptap';

interface BlockReaderProps {
    blocks: TopicBlock[];
    completedBlockIds: string[];
    lockedBlockIds: string[];
}

function toTreeBlock(block: TopicBlock, completedIds: string[], lockedIds: string[]): TreeBlock {
    return {
        id: block.id,
        title: block.title,
        path: block.path,
        blockType: block.blockType,
        depthLevel: block.depthLevel,
        estimatedReadTime: block.estimatedReadTime,
        difficultyLevel: block.difficultyLevel,
        isCompleted: completedIds.includes(block.id),
        isLocked: lockedIds.includes(block.id),
        children: block.children.map((c) => toTreeBlock(c, completedIds, lockedIds)),
    };
}

function findBlock(blocks: TopicBlock[], id: string): TopicBlock | null {
    for (const block of blocks) {
        if (block.id === id) return block;
        const found = findBlock(block.children, id);
        if (found) return found;
    }
    return null;
}

function flattenLeaves(blocks: TopicBlock[]): TopicBlock[] {
    const leaves: TopicBlock[] = [];
    for (const block of blocks) {
        if (!block.children.length || block.blockType !== 'container') {
            leaves.push(block);
        }
        if (block.children.length) {
            leaves.push(...flattenLeaves(block.children));
        }
    }
    return leaves;
}

function getAncestorIds(blocks: TopicBlock[], targetId: string, path: string[] = []): string[] | null {
    for (const block of blocks) {
        if (block.id === targetId) return path;
        if (block.children.length) {
            const found = getAncestorIds(block.children, targetId, [...path, block.id]);
            if (found) return found;
        }
    }
    return null;
}

export function BlockReader({ blocks, completedBlockIds, lockedBlockIds }: BlockReaderProps) {
    const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [simpleMode, setSimpleMode] = useState(false);
    const blockStartTime = useRef<number>(Date.now());

    useEffect(() => { setSimpleMode(false); }, [selectedId]);
    useEffect(() => { blockStartTime.current = Date.now(); }, [selectedId]);

    const leafBlocks = useMemo(() => flattenLeaves(blocks), [blocks]);
    const currentIndex = leafBlocks.findIndex((b) => b.id === selectedId);

    const prevNavigable = useMemo(() => {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (!lockedBlockIds.includes(leafBlocks[i].id)) return leafBlocks[i];
        }
        return null;
    }, [leafBlocks, currentIndex, lockedBlockIds]);

    const nextNavigable = useMemo(() => {
        for (let i = currentIndex + 1; i < leafBlocks.length; i++) {
            if (!lockedBlockIds.includes(leafBlocks[i].id)) return leafBlocks[i];
        }
        return null;
    }, [leafBlocks, currentIndex, lockedBlockIds]);

    const treeBlocks = blocks.map((b) => toTreeBlock(b, completedBlockIds, lockedBlockIds));
    const selectedBlock = selectedId ? findBlock(blocks, selectedId) : null;
    const isSelectedLocked = selectedId ? lockedBlockIds.includes(selectedId) : false;

    function handleToggle(id: string) {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    function handleSelect(block: TreeBlock) {
        if (!block.children.length || block.blockType !== 'container') {
            setSelectedId(block.id);
        }
    }

    function navigateToBlock(target: TopicBlock) {
        setSelectedId(target.id);
        const ancestors = getAncestorIds(blocks, target.id) ?? [];
        if (ancestors.length) {
            setExpanded((prev) => ({
                ...prev,
                ...Object.fromEntries(ancestors.map((id) => [id, true])),
            }));
        }
    }

    function handleToggleComplete(blockId: string) {
        const isCurrentlyCompleted = completedBlockIds.includes(blockId);
        const data = isCurrentlyCompleted
            ? {}
            : { reading_time_seconds: Math.round((Date.now() - blockStartTime.current) / 1000) };
        router.post(toggleBlockComplete.url(blockId), data, { preserveState: true, preserveScroll: true });
    }

    const isCompleted = selectedId ? completedBlockIds.includes(selectedId) : false;

    return (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="space-y-1 overflow-auto rounded-lg border border-border bg-card p-2 lg:max-h-[70vh]" style={{ borderRadius: 'var(--card-radius)' }}>
                {treeBlocks.map((block) => (
                    <TreeNode
                        key={block.id}
                        block={block}
                        expanded={expanded}
                        selectedId={selectedId}
                        onToggle={handleToggle}
                        onSelect={handleSelect}
                    />
                ))}
            </div>

            <div className="rounded-lg border border-border bg-card p-6" style={{ borderRadius: 'var(--card-radius)' }}>
                {selectedBlock ? (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                    {selectedBlock.path && (
                                        <span className="mr-2 text-muted-foreground">{selectedBlock.path}</span>
                                    )}
                                    {selectedBlock.title}
                                </h3>
                                {currentIndex >= 0 && (
                                    <span className="shrink-0 text-[12px] text-muted-foreground">
                                        Block {currentIndex + 1} of {leafBlocks.length}
                                    </span>
                                )}
                            </div>
                            {!isSelectedLocked && (
                                <div className="flex items-center gap-2">
                                    {selectedBlock.simplifiedContent && (
                                        <Button
                                            variant={simpleMode ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setSimpleMode(!simpleMode)}
                                            className="gap-1.5"
                                        >
                                            <Sparkles className="size-3.5" />
                                            {simpleMode ? 'Simple Mode' : 'ELI12'}
                                        </Button>
                                    )}
                                    <Button
                                        variant={isCompleted ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleToggleComplete(selectedBlock.id)}
                                        className="gap-1.5"
                                    >
                                        {isCompleted ? (
                                            <><CheckCircle2 className="size-4" /> Completed</>
                                        ) : (
                                            <><Circle className="size-4" /> Mark complete</>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {isSelectedLocked ? (
                            <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
                                <div className="mb-3 flex items-center gap-2">
                                    <Lock className="size-5 text-amber-600 dark:text-amber-400" />
                                    <h4 className="font-semibold text-amber-800 dark:text-amber-300" style={{ fontFamily: 'var(--font-display)' }}>
                                        This block is locked
                                    </h4>
                                </div>
                                <p className="mb-4 text-sm text-amber-700 dark:text-amber-400" style={{ fontFamily: 'var(--font-body)' }}>
                                    Complete the following prerequisite blocks to unlock this content:
                                </p>
                                <ul className="space-y-2">
                                    {selectedBlock.prerequisites
                                        .filter((p) => p.isHard)
                                        .map((prereq) => {
                                            const prereqCompleted = completedBlockIds.includes(prereq.id);
                                            return (
                                                <li key={prereq.id} className="flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                                                    {prereqCompleted ? (
                                                        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                                                    ) : (
                                                        <Circle className="size-4 shrink-0 text-amber-500" />
                                                    )}
                                                    <span className={prereqCompleted ? 'text-muted-foreground line-through' : 'font-medium'}>
                                                        {prereq.title}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                </ul>
                            </div>
                        ) : selectedBlock.content ? (
                            <div className={simpleMode ? 'rounded-lg border border-primary/30 bg-primary/5 p-4' : undefined}>
                                {simpleMode && (
                                    <div className="mb-3 flex items-center gap-2">
                                        <Sparkles className="size-4 text-primary" />
                                        <span
                                            className="text-[11px] font-semibold uppercase tracking-wider text-primary"
                                            style={{ fontFamily: 'var(--font-body)' }}
                                        >
                                            Simple Mode
                                        </span>
                                    </div>
                                )}
                                <TiptapRenderer content={
                                    (simpleMode && selectedBlock.simplifiedContent
                                        ? selectedBlock.simplifiedContent
                                        : selectedBlock.content) as TiptapJSON
                                } />
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                This is a container block. Select a child block to read its content.
                            </p>
                        )}

                        {(prevNavigable || nextNavigable) && (
                            <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
                                {prevNavigable ? (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => navigateToBlock(prevNavigable)}>
                                        <ChevronLeft className="size-4" />
                                        <div className="text-left">
                                            <div className="text-[10px] uppercase text-muted-foreground">Previous</div>
                                            <div className="max-w-[180px] truncate text-[13px]">{prevNavigable.title}</div>
                                        </div>
                                    </Button>
                                ) : <div />}

                                {nextNavigable ? (
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => navigateToBlock(nextNavigable)}>
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase text-muted-foreground">Next</div>
                                            <div className="max-w-[180px] truncate text-[13px]">{nextNavigable.title}</div>
                                        </div>
                                        <ChevronRight className="size-4" />
                                    </Button>
                                ) : <div />}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex h-40 items-center justify-center text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Select a block from the sidebar to start reading.
                    </div>
                )}
            </div>
        </div>
    );
}
