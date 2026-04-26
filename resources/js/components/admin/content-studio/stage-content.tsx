import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { sileo } from 'sileo';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicContentPanel } from './topic-content-panel';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { csPost, csPut } from '@/lib/content-studio';
import * as ContentStudioAction from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import type { AIModelOption, ContentBlock, ContentProject, ResolvedStageModels, TopicWithBlocks } from '@/types/content-studio';
import type { SaveContentPayload } from './block-content-detail';

interface StageContentProps {
    project: ContentProject;
    topicsWithBlocks: TopicWithBlocks[];
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    onProjectUpdate: (project: ContentProject) => void;
}

export function StageContent({ project, topicsWithBlocks, aiModels, resolvedModels, onProjectUpdate }: StageContentProps) {
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
    const activeTopic = topicsWithBlocks.find((t) => t.id === activeTopicId) ?? null;
    const [busyBlockId, setBusyBlockId] = useState<string | null>(null);

    const { status, message, startStream } = useGenerationStream();
    const isBusy = status === 'processing' || status === 'validating';

    useEffect(() => {
        if (status === 'complete' || status === 'error') {
            setBusyBlockId(null);
        }
    }, [status]);

    const handleRunTopic = useCallback(async (topic: TopicWithBlocks, forceRegenerate: boolean) => {
        try {
            const response = await csPost<{ job_id: string }>(
                ContentStudioAction.runTopicContent.url([project.id, topic.id]),
                { only_unstarted: !forceRegenerate },
            );
            startStream(
                project.id,
                response.job_id,
                (freshProject) => { onProjectUpdate(freshProject); sileo.success({ title: `Topic generation finished: ${topic.title}` }); },
                (errMessage) => sileo.error({ title: errMessage }),
            );
        } catch (e: unknown) {
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to start topic generation' });
        }
    }, [project.id, startStream, onProjectUpdate]);

    const handleRunBlock = useCallback(async (block: ContentBlock, modelId: string | null) => {
        try {
            setBusyBlockId(block.id);
            const response = await csPost<{ job_id: string }>(
                ContentStudioAction.runBlockContent.url([project.id, block.id]),
                modelId ? { model_id: modelId } : {},
            );
            startStream(
                project.id,
                response.job_id,
                (freshProject) => { onProjectUpdate(freshProject); sileo.success({ title: `Block generated: ${block.title}` }); },
                (errMessage) => sileo.error({ title: errMessage }),
            );
        } catch (e: unknown) {
            setBusyBlockId(null);
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to start block generation' });
        }
    }, [project.id, startStream, onProjectUpdate]);

    const handleRegenerateBlock = useCallback(async (block: ContentBlock, modelId: string | null) => {
        try {
            setBusyBlockId(block.id);
            const response = await csPost<{ job_id: string }>(
                ContentStudioAction.regenerateBlockContent.url([project.id, block.id]),
                modelId ? { model_id: modelId } : {},
            );
            startStream(
                project.id,
                response.job_id,
                (freshProject) => { onProjectUpdate(freshProject); sileo.success({ title: `Block regenerated: ${block.title}` }); },
                (errMessage) => sileo.error({ title: errMessage }),
            );
        } catch (e: unknown) {
            setBusyBlockId(null);
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to regenerate block' });
        }
    }, [project.id, startStream, onProjectUpdate]);

    const handleSaveBlock = useCallback(async (block: ContentBlock, payload: SaveContentPayload): Promise<void> => {
        try {
            const { project: fresh } = await csPut<{ project: ContentProject }>(
                ContentStudioAction.saveBlockContent.url([project.id, block.id]),
                payload as unknown as Record<string, unknown>,
            );
            onProjectUpdate(fresh);
            sileo.success({ title: 'Block saved' });
            if (mountedRef.current) {
                await new Promise<void>((resolve) =>
                    router.reload({ only: ['topicsWithBlocks'], onFinish: () => resolve() })
                );
            }
        } catch (e: unknown) {
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to save block' });
            throw e;
        }
    }, [project.id, onProjectUpdate]);

    const handleApproveBlock = useCallback(async (block: ContentBlock): Promise<void> => {
        try {
            const { project: fresh } = await csPost<{ project: ContentProject }>(
                ContentStudioAction.approveBlockContent.url([project.id, block.id]),
            );
            onProjectUpdate(fresh);
            sileo.success({ title: 'Block approved' });
            if (mountedRef.current) {
                await new Promise<void>((resolve) =>
                    router.reload({ only: ['topicsWithBlocks'], onFinish: () => resolve() })
                );
            }
        } catch (e: unknown) {
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to approve block' });
            throw e;
        }
    }, [project.id, onProjectUpdate]);

    const handleDismissAdvisory = useCallback(async (block: ContentBlock) => {
        try {
            const { project: fresh } = await csPost<{ project: ContentProject }>(
                ContentStudioAction.dismissBlockAdvisory.url([project.id, block.id]),
            );
            onProjectUpdate(fresh);
            sileo.success({ title: 'Advisory dismissed' });
            if (mountedRef.current) router.reload({ only: ['topicsWithBlocks'] });
        } catch (e: unknown) {
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to dismiss advisory' });
        }
    }, [project.id, onProjectUpdate]);

    const handleMarkComplete = useCallback(async (topic: TopicWithBlocks) => {
        try {
            const { project: fresh } = await csPost<{ project: ContentProject }>(
                ContentStudioAction.markTopicComplete.url([project.id, topic.id]),
            );
            onProjectUpdate(fresh);
            sileo.success({ title: `Topic published: ${topic.title}` });
            if (mountedRef.current) router.reload({ only: ['topicsWithBlocks'] });
        } catch (e: unknown) {
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to mark topic complete' });
        }
    }, [project.id, onProjectUpdate]);

    const handleUpdateGuidance = useCallback(async (block: ContentBlock, guidance: string): Promise<void> => {
        try {
            const { project: fresh } = await csPut<{ project: ContentProject }>(
                ContentStudioAction.updateBlockGuidance.url([project.id, block.id]),
                { content_guidance: guidance },
            );
            onProjectUpdate(fresh);
            sileo.success({ title: 'Guidance saved' });
            if (mountedRef.current) {
                await new Promise<void>((resolve) =>
                    router.reload({ only: ['topicsWithBlocks'], onFinish: () => resolve() })
                );
            }
        } catch (e: unknown) {
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to save guidance' });
            throw e;
        }
    }, [project.id, onProjectUpdate]);

    const handleResetTopic = useCallback(async (topic: TopicWithBlocks, confirmSlug: string) => {
        try {
            const { project: fresh } = await csPost<{ project: ContentProject }>(
                ContentStudioAction.resetTopicContent.url([project.id, topic.id]),
                { confirm_slug: confirmSlug },
            );
            onProjectUpdate(fresh);
            sileo.success({ title: `Topic reset: ${topic.title}` });
            if (mountedRef.current) router.reload({ only: ['topicsWithBlocks'] });
        } catch (e: unknown) {
            sileo.error({ title: e instanceof Error ? e.message : 'Failed to reset topic' });
        }
    }, [project.id, onProjectUpdate]);

    if (activeTopic) {
        return (
            <div className="flex h-full flex-col">
                <div className="px-6 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => setActiveTopicId(null)}>
                        <ChevronLeft className="mr-1 h-3.5 w-3.5" aria-hidden />
                        All topics
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <TopicContentPanel
                        project={project}
                        topic={activeTopic}
                        aiModels={aiModels}
                        resolvedModels={resolvedModels}
                        isBusy={isBusy}
                        busyMessage={message}
                        busyStatus={status}
                        busyBlockId={busyBlockId}
                        onRunTopic={(force) => handleRunTopic(activeTopic, force)}
                        onRunBlock={handleRunBlock}
                        onRegenerateBlock={handleRegenerateBlock}
                        onSaveBlock={handleSaveBlock}
                        onApproveBlock={handleApproveBlock}
                        onDismissAdvisory={handleDismissAdvisory}
                        onUpdateGuidance={handleUpdateGuidance}
                        onMarkTopicComplete={() => handleMarkComplete(activeTopic)}
                        onResetTopic={(slug) => handleResetTopic(activeTopic, slug)}
                        onProjectUpdate={onProjectUpdate}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-foreground">Content stage</h2>
                <p className="text-sm text-muted-foreground">
                    Generate, review, and publish content per topic.
                </p>
            </div>

            {topicsWithBlocks.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
                    No topics have approved block structures yet. Complete the blocks stage first.
                </div>
            ) : (
                <ul className="divide-y divide-border rounded-md border border-border bg-card">
                    {topicsWithBlocks.map((topic) => {
                        const leafCount = topic.blocks.filter((b) => !b.is_container).length;
                        const approvedCount = topic.blocks.filter((b) => b.generation_status === 'approved').length;
                        const isPublished = topic.is_published;
                        return (
                            <li key={topic.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveTopicId(topic.id)}
                                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/50"
                                >
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="truncate text-sm font-medium text-foreground">{topic.title}</span>
                                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                            {approvedCount}/{leafCount} approved
                                        </span>
                                    </div>
                                    {isPublished ? (
                                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-success)]">● Published</span>
                                    ) : approvedCount === leafCount && leafCount > 0 ? (
                                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-warning)]">Ready</span>
                                    ) : (
                                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">In progress</span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
