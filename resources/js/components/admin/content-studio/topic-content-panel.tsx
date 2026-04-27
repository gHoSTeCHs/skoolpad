import { useMemo, useState } from 'react';
import { Check, CircleDot } from 'lucide-react';
import { BlockContentDetail, type SaveContentPayload } from './block-content-detail';
import { GenerateAllBlocksDialog } from './generate-all-blocks-dialog';
import { MarkTopicCompleteDialog } from './mark-topic-complete-dialog';
import { ResetTopicDialog } from './reset-topic-dialog';
import { comparePaths } from '@/lib/content-studio';
import type { AIModelOption, ContentBlock, ContentProject, ResolvedStageModels, TopicWithBlocks } from '@/types/content-studio';

interface TopicContentPanelProps {
    project: ContentProject;
    topic: TopicWithBlocks;
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    isBusy: boolean;
    busyMessage: string;
    busyStatus: 'idle' | 'processing' | 'validating' | 'complete' | 'error';
    busyBlockId: string | null;
    onRunTopic: (forceRegenerate: boolean) => void;
    onRunBlock: (block: ContentBlock, modelId: string | null) => void;
    onRegenerateBlock: (block: ContentBlock, modelId: string | null) => void;
    onSaveBlock: (block: ContentBlock, payload: SaveContentPayload) => Promise<void>;
    onApproveBlock: (block: ContentBlock) => Promise<void>;
    onDismissAdvisory: (block: ContentBlock) => void;
    onUpdateGuidance: (block: ContentBlock, guidance: string) => Promise<void>;
    onMarkTopicComplete: () => void;
    onResetTopic: (confirmSlug: string) => void;
    onProjectUpdate: (project: ContentProject) => void;
}

export function TopicContentPanel({
    project,
    topic,
    aiModels,
    resolvedModels,
    isBusy,
    busyMessage,
    busyStatus,
    busyBlockId,
    onRunTopic,
    onRunBlock,
    onRegenerateBlock,
    onSaveBlock,
    onApproveBlock,
    onDismissAdvisory,
    onUpdateGuidance,
    onMarkTopicComplete,
    onResetTopic,
    onProjectUpdate,
}: TopicContentPanelProps) {
    const leafBlocks = useMemo(
        () => topic.blocks.filter((b) => !b.is_container).sort((a, b) => comparePaths(a.path, b.path)),
        [topic.blocks],
    );

    const [selectedId, setSelectedId] = useState<string | null>(leafBlocks[0]?.id ?? null);
    const selected = leafBlocks.find((b) => b.id === selectedId) ?? leafBlocks[0] ?? null;

    const notStartedCount = leafBlocks.filter((b) => b.generation_status === 'not_started').length;
    const approvedCount = leafBlocks.filter((b) => b.generation_status === 'approved').length;
    const allApproved = approvedCount === leafBlocks.length && leafBlocks.length > 0;

    return (
        <div className="flex h-full flex-col">
            {/* Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-foreground">{topic.title}</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {approvedCount}/{leafBlocks.length} approved
                        </span>
                        {topic.is_published && (
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-success)]">
                                ● Published
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <GenerateAllBlocksDialog
                        topicTitle={topic.title}
                        blockCount={leafBlocks.length}
                        notStartedCount={notStartedCount}
                        resolvedModel={resolvedModels.content}
                        onConfirm={onRunTopic}
                        disabled={isBusy}
                    />
                    <MarkTopicCompleteDialog
                        topicTitle={topic.title}
                        blockCount={leafBlocks.length}
                        allApproved={allApproved}
                        onConfirm={onMarkTopicComplete}
                        disabled={isBusy}
                    />
                    <ResetTopicDialog
                        topicTitle={topic.title}
                        topicSlug={topic.slug}
                        onConfirm={onResetTopic}
                        disabled={isBusy}
                    />
                </div>
            </div>

            {/* Body */}
            <div className="grid min-h-0 flex-1 grid-cols-[18rem_1fr] overflow-hidden">
                {/* Left — block list */}
                <div className="overflow-y-auto border-r border-border bg-card">
                    <ul className="divide-y divide-border">
                        {leafBlocks.map((block) => {
                            const isSelected = selected?.id === block.id;
                            const isThisBusy = busyBlockId === block.id;
                            return (
                                <li key={block.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(block.id)}
                                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                                            isSelected ? 'bg-primary/8' : 'hover:bg-muted/50'
                                        }`}
                                    >
                                        <BlockStatusIcon block={block} isBusy={isThisBusy} />
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                                {block.path}
                                            </span>
                                            <span className="truncate text-sm text-foreground">{block.title}</span>
                                            {block.drift_advisory && (
                                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warning)]">
                                                    ⚠ advisory
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Right — block detail */}
                <div className="overflow-y-auto">
                    {selected ? (
                        <BlockContentDetail
                            project={project}
                            block={selected}
                            aiModels={aiModels}
                            resolvedModels={resolvedModels}
                            isBusy={isBusy && (busyBlockId === null || busyBlockId === selected.id)}
                            busyMessage={busyMessage}
                            busyStatus={busyStatus}
                            onGenerate={(modelId) => onRunBlock(selected, modelId)}
                            onApprove={() => onApproveBlock(selected)}
                            onRegenerate={(modelId) => onRegenerateBlock(selected, modelId)}
                            onSave={(payload) => onSaveBlock(selected, payload)}
                            onDismissAdvisory={() => onDismissAdvisory(selected)}
                            onUpdateGuidance={(guidance) => onUpdateGuidance(selected, guidance)}
                            onProjectUpdate={onProjectUpdate}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center p-12 text-sm text-muted-foreground">
                            This topic has no leaf blocks.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function BlockStatusIcon({ block, isBusy }: { block: ContentBlock; isBusy: boolean }) {
    if (isBusy) {
        return <CircleDot className="mt-1 h-3.5 w-3.5 animate-pulse text-[color:var(--color-warning)]" aria-hidden />;
    }
    if (block.generation_status === 'approved') {
        return <Check className="mt-1 h-3.5 w-3.5 text-[color:var(--color-success)]" aria-hidden />;
    }
    const tone =
        block.generation_status === 'generated' ? 'bg-[color:var(--color-warning)]' : 'bg-muted-foreground/40';
    return <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${tone}`} aria-hidden />;
}

