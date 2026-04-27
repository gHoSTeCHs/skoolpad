import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { sileo } from 'sileo';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { csPost, csPut } from '@/lib/content-studio';
import { comparePaths } from '@/lib/content-studio';
import * as ContentStudioAction from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { TopicsColumn } from './topics-column';
import { BlocksColumn } from './blocks-column';
import { BlockEditor, type SaveContentPayload } from './block-editor';
import { GenerateAllBlocksDialog } from './generate-all-blocks-dialog';
import { MarkTopicCompleteDialog } from './mark-topic-complete-dialog';
import { ResetTopicDialog } from './reset-topic-dialog';
import { InspectorPanel } from './inspector-panel';
import type { InspectorTab } from './inspector-peek';
import type {
    AIModelOption,
    ContentBlock,
    ContentProject,
    GenerationLogEntry,
    ResolvedStageModels,
    TopicWithBlocks,
} from '@/types/content-studio';

interface StageContentPreviewProps {
    project: ContentProject;
    topicsWithBlocks: TopicWithBlocks[];
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    generationLogs: GenerationLogEntry[];
    inspectorTab: InspectorTab | null;
    onInspectorTabClick: (tab: InspectorTab) => void;
    onProjectUpdate: (project: ContentProject) => void;
}

export function StageContentPreview({
    project,
    topicsWithBlocks,
    aiModels,
    resolvedModels,
    generationLogs,
    inspectorTab,
    onInspectorTabClick,
    onProjectUpdate,
}: StageContentPreviewProps) {
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const [activeTopicId, setActiveTopicId] = useState<string | null>(topicsWithBlocks[0]?.id ?? null);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [busyBlockId, setBusyBlockId] = useState<string | null>(null);

    const [generateAllOpen, setGenerateAllOpen] = useState(false);
    const [markCompleteOpen, setMarkCompleteOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);

    const { status, startStream } = useGenerationStream();
    const isBusy = status === 'processing' || status === 'validating';

    useEffect(() => {
        if (status === 'complete' || status === 'error') setBusyBlockId(null);
    }, [status]);

    const activeTopic = useMemo(
        () => topicsWithBlocks.find((t) => t.id === activeTopicId) ?? topicsWithBlocks[0] ?? null,
        [topicsWithBlocks, activeTopicId],
    );

    const leafBlocks = useMemo(
        () =>
            activeTopic
                ? activeTopic.blocks.filter((b) => !b.is_container).sort((a, b) => comparePaths(a.path, b.path))
                : [],
        [activeTopic],
    );

    useEffect(() => {
        if (!activeTopic) {
            setActiveBlockId(null);
            return;
        }
        const stillExists = leafBlocks.some((b) => b.id === activeBlockId);
        if (!stillExists) setActiveBlockId(leafBlocks[0]?.id ?? null);
    }, [activeTopic?.id, leafBlocks, activeBlockId]);

    const activeBlock = leafBlocks.find((b) => b.id === activeBlockId) ?? null;
    const activeBlockIndex = activeBlock ? leafBlocks.findIndex((b) => b.id === activeBlock.id) : -1;

    const blockHistory = useMemo(
        () =>
            activeBlock
                ? generationLogs.filter((l) => l.content_block_id === activeBlock.id)
                : [],
        [generationLogs, activeBlock],
    );

    const handleRunTopic = useCallback(
        async (topic: TopicWithBlocks, forceRegenerate: boolean) => {
            try {
                const response = await csPost<{ job_id: string }>(
                    ContentStudioAction.runTopicContent.url([project.id, topic.id]),
                    { only_unstarted: !forceRegenerate },
                );
                startStream(
                    project.id,
                    response.job_id,
                    (freshProject) => {
                        onProjectUpdate(freshProject);
                        sileo.success({ title: `Topic generation finished: ${topic.title}` });
                    },
                    (errMessage) => sileo.error({ title: errMessage }),
                );
            } catch (e) {
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to start topic generation' });
            }
        },
        [project.id, startStream, onProjectUpdate],
    );

    const handleRunBlock = useCallback(
        async (block: ContentBlock, modelId: string | null) => {
            try {
                setBusyBlockId(block.id);
                const response = await csPost<{ job_id: string }>(
                    ContentStudioAction.runBlockContent.url([project.id, block.id]),
                    modelId ? { model_id: modelId } : {},
                );
                startStream(
                    project.id,
                    response.job_id,
                    (freshProject) => {
                        onProjectUpdate(freshProject);
                        sileo.success({ title: `Block generated: ${block.title}` });
                    },
                    (errMessage) => sileo.error({ title: errMessage }),
                );
            } catch (e) {
                setBusyBlockId(null);
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to start block generation' });
            }
        },
        [project.id, startStream, onProjectUpdate],
    );

    const handleRegenerateBlock = useCallback(
        async (block: ContentBlock, modelId: string | null) => {
            try {
                setBusyBlockId(block.id);
                const response = await csPost<{ job_id: string }>(
                    ContentStudioAction.regenerateBlockContent.url([project.id, block.id]),
                    modelId ? { model_id: modelId } : {},
                );
                startStream(
                    project.id,
                    response.job_id,
                    (freshProject) => {
                        onProjectUpdate(freshProject);
                        sileo.success({ title: `Block regenerated: ${block.title}` });
                    },
                    (errMessage) => sileo.error({ title: errMessage }),
                );
            } catch (e) {
                setBusyBlockId(null);
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to regenerate block' });
            }
        },
        [project.id, startStream, onProjectUpdate],
    );

    const handleSaveBlock = useCallback(
        async (block: ContentBlock, payload: SaveContentPayload) => {
            try {
                const { project: fresh } = await csPut<{ project: ContentProject }>(
                    ContentStudioAction.saveBlockContent.url([project.id, block.id]),
                    payload as unknown as Record<string, unknown>,
                );
                onProjectUpdate(fresh);
                sileo.success({ title: 'Block saved' });
                if (mountedRef.current) {
                    await new Promise<void>((resolve) =>
                        router.reload({ only: ['topicsWithBlocks'], onFinish: () => resolve() }),
                    );
                }
            } catch (e) {
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to save block' });
                throw e;
            }
        },
        [project.id, onProjectUpdate],
    );

    const handleApproveBlock = useCallback(
        async (block: ContentBlock) => {
            try {
                const { project: fresh } = await csPost<{ project: ContentProject }>(
                    ContentStudioAction.approveBlockContent.url([project.id, block.id]),
                );
                onProjectUpdate(fresh);
                sileo.success({ title: 'Block approved' });
                if (mountedRef.current) {
                    await new Promise<void>((resolve) =>
                        router.reload({ only: ['topicsWithBlocks'], onFinish: () => resolve() }),
                    );
                }
            } catch (e) {
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to approve block' });
                throw e;
            }
        },
        [project.id, onProjectUpdate],
    );

    const handleDismissAdvisory = useCallback(
        async (block: ContentBlock) => {
            try {
                const { project: fresh } = await csPost<{ project: ContentProject }>(
                    ContentStudioAction.dismissBlockAdvisory.url([project.id, block.id]),
                );
                onProjectUpdate(fresh);
                sileo.success({ title: 'Advisory dismissed' });
                if (mountedRef.current) router.reload({ only: ['topicsWithBlocks'] });
            } catch (e) {
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to dismiss advisory' });
            }
        },
        [project.id, onProjectUpdate],
    );

    const handleMarkComplete = useCallback(
        async (topic: TopicWithBlocks) => {
            try {
                const { project: fresh } = await csPost<{ project: ContentProject }>(
                    ContentStudioAction.markTopicComplete.url([project.id, topic.id]),
                );
                onProjectUpdate(fresh);
                sileo.success({ title: `Topic published: ${topic.title}` });
                if (mountedRef.current) router.reload({ only: ['topicsWithBlocks'] });
            } catch (e) {
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to mark topic complete' });
            }
        },
        [project.id, onProjectUpdate],
    );

    const handleUpdateGuidance = useCallback(
        async (block: ContentBlock, guidance: string) => {
            try {
                const { project: fresh } = await csPut<{ project: ContentProject }>(
                    ContentStudioAction.updateBlockGuidance.url([project.id, block.id]),
                    { content_guidance: guidance },
                );
                onProjectUpdate(fresh);
                sileo.success({ title: 'Guidance saved' });
                if (mountedRef.current) {
                    await new Promise<void>((resolve) =>
                        router.reload({ only: ['topicsWithBlocks'], onFinish: () => resolve() }),
                    );
                }
            } catch (e) {
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to save guidance' });
                throw e;
            }
        },
        [project.id, onProjectUpdate],
    );

    const handleResetTopic = useCallback(
        async (topic: TopicWithBlocks, confirmSlug: string) => {
            try {
                const { project: fresh } = await csPost<{ project: ContentProject }>(
                    ContentStudioAction.resetTopicContent.url([project.id, topic.id]),
                    { confirm_slug: confirmSlug },
                );
                onProjectUpdate(fresh);
                sileo.success({ title: `Topic reset: ${topic.title}` });
                if (mountedRef.current) router.reload({ only: ['topicsWithBlocks'] });
            } catch (e) {
                sileo.error({ title: e instanceof Error ? e.message : 'Failed to reset topic' });
            }
        },
        [project.id, onProjectUpdate],
    );

    if (topicsWithBlocks.length === 0) {
        return (
            <div className="flex h-full items-center justify-center p-12 text-[14px] text-muted-foreground">
                No topics have approved block structures yet. Complete the blocks stage first.
            </div>
        );
    }

    if (!activeTopic) return null;

    const notStartedCount = leafBlocks.filter((b) => b.generation_status === 'not_started').length;
    const allApproved = leafBlocks.length > 0 && leafBlocks.every((b) => b.generation_status === 'approved');

    return (
        <>
            <div className="grid h-full min-h-0 grid-cols-[260px_320px_1fr] overflow-hidden">
                <TopicsColumn
                    topics={topicsWithBlocks}
                    activeTopicId={activeTopic.id}
                    onTopicClick={(id) => {
                        setActiveTopicId(id);
                        setActiveBlockId(null);
                    }}
                />

                <BlocksColumn
                    topic={activeTopic}
                    activeBlockId={activeBlock?.id ?? null}
                    busyBlockId={busyBlockId}
                    onBlockClick={setActiveBlockId}
                    onGenerateAllClick={() => setGenerateAllOpen(true)}
                    onMarkCompleteClick={() => setMarkCompleteOpen(true)}
                    onResetClick={() => setResetOpen(true)}
                    generateAllDisabled={isBusy}
                    canMarkComplete={allApproved}
                />

                {activeBlock ? (
                    <BlockEditor
                        project={project}
                        block={activeBlock}
                        aiModels={aiModels}
                        resolvedModels={resolvedModels}
                        isBusy={isBusy && (busyBlockId === null || busyBlockId === activeBlock.id)}
                        onGenerate={(modelId) => handleRunBlock(activeBlock, modelId)}
                        onApprove={() => handleApproveBlock(activeBlock)}
                        onRegenerate={(modelId) => handleRegenerateBlock(activeBlock, modelId)}
                        onSave={(payload) => handleSaveBlock(activeBlock, payload)}
                        onProjectUpdate={onProjectUpdate}
                        onPrevBlock={
                            activeBlockIndex > 0
                                ? () => setActiveBlockId(leafBlocks[activeBlockIndex - 1].id)
                                : null
                        }
                        onNextBlock={
                            activeBlockIndex < leafBlocks.length - 1
                                ? () => setActiveBlockId(leafBlocks[activeBlockIndex + 1].id)
                                : null
                        }
                    />
                ) : (
                    <div className="flex items-center justify-center text-[13px] text-muted-foreground">
                        This topic has no leaf blocks.
                    </div>
                )}
            </div>

            <InspectorPanel
                open={inspectorTab !== null}
                tab={inspectorTab}
                block={activeBlock}
                blockHistory={blockHistory}
                onClose={() => inspectorTab && onInspectorTabClick(inspectorTab)}
                onUpdateGuidance={(g) => (activeBlock ? handleUpdateGuidance(activeBlock, g) : Promise.resolve())}
                onDismissAdvisory={() => activeBlock && handleDismissAdvisory(activeBlock)}
                onRegenerate={() => activeBlock && handleRegenerateBlock(activeBlock, null)}
                isBusy={isBusy}
            />

            <GenerateAllBlocksDialog
                open={generateAllOpen}
                onOpenChange={setGenerateAllOpen}
                hideTrigger
                topicTitle={activeTopic.title}
                blockCount={leafBlocks.length}
                notStartedCount={notStartedCount}
                resolvedModel={resolvedModels.content}
                onConfirm={(force) => {
                    setGenerateAllOpen(false);
                    handleRunTopic(activeTopic, force);
                }}
                disabled={isBusy}
            />

            <MarkTopicCompleteDialog
                open={markCompleteOpen}
                onOpenChange={setMarkCompleteOpen}
                hideTrigger
                topicTitle={activeTopic.title}
                blockCount={leafBlocks.length}
                allApproved={allApproved}
                onConfirm={() => {
                    setMarkCompleteOpen(false);
                    handleMarkComplete(activeTopic);
                }}
                disabled={isBusy}
            />

            <ResetTopicDialog
                open={resetOpen}
                onOpenChange={setResetOpen}
                hideTrigger
                topicTitle={activeTopic.title}
                topicSlug={activeTopic.slug}
                onConfirm={(slug) => {
                    setResetOpen(false);
                    handleResetTopic(activeTopic, slug);
                }}
                disabled={isBusy}
            />
        </>
    );
}
