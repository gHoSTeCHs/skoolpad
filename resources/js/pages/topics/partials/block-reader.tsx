import { router } from '@inertiajs/react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';
import { TreeNode, type TreeBlock } from '@/components/skoolpad/block-tree/tree-node';
import { TiptapRenderer } from '@/components/shared/tiptap-renderer';
import { Button } from '@/components/ui/button';
import { toggleBlockComplete } from '@/actions/App/Http/Controllers/Student/TopicController';
import type { TopicBlock } from '@/types/student-topics';
import type { TiptapJSON } from '@/types/tiptap';

interface BlockReaderProps {
    blocks: TopicBlock[];
    completedBlockIds: string[];
}

function toTreeBlock(block: TopicBlock, completedIds: string[]): TreeBlock {
    return {
        id: block.id,
        title: block.title,
        path: block.path,
        blockType: block.blockType,
        depthLevel: block.depthLevel,
        estimatedReadTime: block.estimatedReadTime,
        difficultyLevel: block.difficultyLevel,
        isCompleted: completedIds.includes(block.id),
        children: block.children.map((c) => toTreeBlock(c, completedIds)),
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

export function BlockReader({ blocks, completedBlockIds }: BlockReaderProps) {
    const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const treeBlocks = blocks.map((b) => toTreeBlock(b, completedBlockIds));
    const selectedBlock = selectedId ? findBlock(blocks, selectedId) : null;

    function handleToggle(id: string) {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    function handleSelect(block: TreeBlock) {
        if (!block.children.length || block.blockType !== 'container') {
            setSelectedId(block.id);
        }
    }

    function handleToggleComplete(blockId: string) {
        router.post(toggleBlockComplete.url(blockId), {}, { preserveState: true, preserveScroll: true });
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
                            <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                {selectedBlock.path && (
                                    <span className="mr-2 text-muted-foreground">{selectedBlock.path}</span>
                                )}
                                {selectedBlock.title}
                            </h3>
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

                        {selectedBlock.content ? (
                            <TiptapRenderer content={selectedBlock.content as TiptapJSON} />
                        ) : (
                            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                This is a container block. Select a child block to read its content.
                            </p>
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
