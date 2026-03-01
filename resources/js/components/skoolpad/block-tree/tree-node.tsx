import { Lock } from 'lucide-react';
import BlockTypeIcon from './block-type-icon';
import DifficultyBadge from './difficulty-badge';

export interface TreeBlock {
    id: string;
    title: string;
    path: string;
    blockType: string;
    depthLevel: number;
    estimatedReadTime: number | null;
    difficultyLevel: string | null;
    isCompleted?: boolean;
    isLocked?: boolean;
    children: TreeBlock[];
}

interface TreeNodeProps {
    block: TreeBlock;
    expanded: Record<string, boolean>;
    selectedId: string | null;
    onToggle: (id: string) => void;
    onSelect: (block: TreeBlock) => void;
    depth?: number;
}

export function TreeNode({ block, expanded, selectedId, onToggle, onSelect, depth = 0 }: TreeNodeProps) {
    const isExpanded = expanded[block.id] ?? (block.depthLevel < 2);
    const isSelected = selectedId === block.id;
    const hasChildren = block.children.length > 0;

    return (
        <div>
            <button
                onClick={() => {
                    if (hasChildren) onToggle(block.id);
                    onSelect(block);
                }}
                className={
                    'flex w-full cursor-pointer items-center gap-2 rounded-lg border-l-2 px-3 py-[6px] text-left transition-all duration-150'
                    + (isSelected
                        ? ' border-primary bg-primary/5'
                        : ' border-transparent hover:bg-[var(--bg-raised)]')
                    + (block.isLocked ? ' opacity-50' : '')
                }
                style={{ paddingLeft: `${depth * 20 + 12}px` }}
            >
                {hasChildren ? (
                    <span className={'inline-block text-[10px] text-muted-foreground transition-transform duration-150' + (isExpanded ? ' rotate-90' : '')}>
                        {'\u25B6'}
                    </span>
                ) : (
                    <span className="inline-block w-[10px]" />
                )}

                <BlockTypeIcon type={block.blockType} />

                <span
                    className="flex-1 truncate text-[13px] font-medium"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    {block.path ? <span className="mr-1.5 text-muted-foreground">{block.path}</span> : null}
                    {block.title}
                </span>

                {block.isLocked ? (
                    <Lock className="size-3.5 shrink-0 text-amber-500" />
                ) : block.isCompleted ? (
                    <span className="shrink-0 text-[12px] text-green-500">{'\u2713'}</span>
                ) : null}

                {block.estimatedReadTime && (
                    <span className="shrink-0 text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {block.estimatedReadTime}m
                    </span>
                )}

                <DifficultyBadge level={block.difficultyLevel} />
            </button>

            {hasChildren && isExpanded && (
                <div>
                    {block.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            block={child}
                            expanded={expanded}
                            selectedId={selectedId}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
