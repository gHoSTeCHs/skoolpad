import {
    AlertTriangle,
    Blocks,
    Check,
    Info,
    Loader2,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import {
    runBlocks,
    approveBlocks,
} from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { BlockTree } from '@/components/admin/content-studio/block-tree';
import { CompoundGenerateButton } from '@/components/admin/content-studio/compound-generate-button';
import { GenerationProgress } from '@/components/admin/content-studio/generation-progress';
import { TopicProgressList } from '@/components/admin/content-studio/topic-progress-list';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useGenerationStream } from '@/hooks/use-generation-stream';
import { csPost } from '@/lib/content-studio';
import { slugify } from '@/lib/slug';
import type {
    AIModelOption,
    BlockNode,
    BlockStructureResult,
    ContentProject,
    GenerationLogEntry,
    ResolvedStageModel,
} from '@/types/content-studio';

interface StageBlocksPreviewProps {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModel: ResolvedStageModel;
    isActive: boolean;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

interface TopicEntry {
    key: string;
    title: string;
    status: 'pending' | 'generated' | 'approved';
}

function PaperShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="paper-surface h-full overflow-y-auto">
            <div className="mx-auto max-w-[1100px] px-10 py-8">{children}</div>
        </div>
    );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
    return (
        <div className="section-label uppercase tracking-[0.08em]">{children}</div>
    );
}

function getTopicList(project: ContentProject): TopicEntry[] {
    const scheme = project.ai_context?.scheme_approved;
    const research = project.ai_context?.research_approved;
    const blocks = project.ai_context?.blocks ?? {};
    const approved = project.progress_data?.blocks_approved ?? {};

    const titles: { key: string; title: string }[] = [];

    if (scheme) {
        for (const term of scheme) {
            for (const topic of term.topics) {
                const key = slugify(topic.title);
                titles.push({ key, title: topic.title });
            }
        }
    } else if (research) {
        for (const topic of research) {
            const key = slugify(topic.title);
            titles.push({ key, title: topic.title });
        }
    }

    return titles.map(({ key, title }) => ({
        key,
        title,
        status: approved[key]
            ? 'approved'
            : blocks[key]
              ? 'generated'
              : 'pending',
    }));
}

function BlockDetailPanel({
    project,
    topicKey,
    topicTitle,
    status,
    blockData,
    aiModels,
    resolvedModel,
    runOverrideId,
    onRunOverrideChange,
    onProjectUpdate,
    onLogAppend,
}: {
    project: ContentProject;
    topicKey: string;
    topicTitle: string;
    status: 'pending' | 'generated' | 'approved';
    blockData: BlockStructureResult | null;
    aiModels: AIModelOption[];
    resolvedModel: ResolvedStageModel;
    runOverrideId: string | null;
    onRunOverrideChange: (value: string | null) => void;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}) {
    const [editedBlocks, setEditedBlocks] = useState<BlockNode[]>(
        blockData?.blocks ?? [],
    );
    const [isApproving, setIsApproving] = useState(false);
    const [confirmRegenOpen, setConfirmRegenOpen] = useState(false);

    useEffect(() => {
        setEditedBlocks(blockData?.blocks ?? []);
    }, [blockData]);

    const { status: streamStatus, message: streamMessage, startStream } = useGenerationStream();
    const isGenerating = streamStatus === 'processing' || streamStatus === 'validating';

    async function handleGenerate() {
        try {
            const { job_id } = await csPost<{ job_id: string }>(
                runBlocks.url(project.id),
                {
                    topic_key: topicKey,
                    ...(runOverrideId && { model_id: runOverrideId }),
                },
            );
            startStream(
                project.id,
                job_id,
                (updatedProject, logEntry) => {
                    onProjectUpdate(updatedProject);
                    if (logEntry) onLogAppend(logEntry);
                    onRunOverrideChange(null);
                },
                (errorMsg) => sileo.error({ title: errorMsg }),
            );
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
        }
    }

    async function handleApprove() {
        if (!blockData) return;
        setIsApproving(true);
        try {
            const { project: updated, message } = await csPost<{ project: ContentProject; message: string }>(
                approveBlocks.url(project.id),
                {
                    topic_key: topicKey,
                    topic_title: blockData.topic_title,
                    topic_slug: blockData.topic_slug,
                    topic_summary: blockData.topic_summary,
                    estimated_total_minutes: blockData.estimated_total_minutes,
                    blocks: editedBlocks,
                },
            );
            onProjectUpdate(updated);
            sileo.success({ title: message });
            router.reload({ only: ['topicsWithBlocks'] });
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
        } finally {
            setIsApproving(false);
        }
    }

    if (status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
                <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-5">
                    <Blocks
                        className="size-6 text-muted-foreground/40"
                        style={{ animation: 'empty-pulse 3s ease-in-out infinite' }}
                    />
                </div>
                <div className="space-y-1">
                    <p className="font-display text-[18px] font-semibold tracking-tight">
                        {topicTitle}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                        AI will generate a hierarchical content structure for this topic.
                    </p>
                </div>
                <GenerationProgress status={streamStatus} message={streamMessage} />
                <CompoundGenerateButton
                    projectId={project.id}
                    stage="blocks"
                    resolvedModel={resolvedModel}
                    aiModels={aiModels}
                    currentStageOverrideId={project.blocks_model_id}
                    runOverrideId={runOverrideId}
                    onProjectUpdate={onProjectUpdate}
                    onRunOverrideChange={onRunOverrideChange}
                    label="Generate block structure"
                    busy={isGenerating}
                    busyLabel="Generating"
                    onGenerate={handleGenerate}
                />
            </div>
        );
    }

    if (status === 'approved' && blockData) {
        return (
            <div className="space-y-4 px-1">
                <div className="flex items-center gap-2 rounded-md bg-[var(--badge-primary-bg)]/30 px-3 py-2 text-[13px] font-medium text-[var(--badge-primary-fg)]">
                    <Check className="size-4" />
                    {topicTitle} — approved
                </div>
                <div className="tech">
                    {blockData.total_leaf_blocks} blocks · {blockData.estimated_total_minutes} min total
                    {blockData.total_visualization_flags > 0 &&
                        ` · ${blockData.total_visualization_flags} visualizations`}
                </div>
                <BlockTree
                    blocks={blockData.blocks}
                    onChange={() => {}}
                    readOnly
                />
            </div>
        );
    }

    if (status === 'generated' && blockData) {
        const leafCount = editedBlocks.filter((b) => !b.is_container).length;
        const totalMinutes = editedBlocks.reduce(
            (sum, b) => sum + (b.estimated_read_time ?? 0),
            0,
        );

        return (
            <div className="space-y-4 px-1">
                <div className="flex items-baseline justify-between border-b border-dashed border-[var(--border)] pb-3">
                    <div>
                        <h3 className="font-display text-[18px] font-semibold tracking-tight">
                            {topicTitle}
                        </h3>
                        <p className="tech">
                            {leafCount} blocks · {totalMinutes} min total
                        </p>
                    </div>
                </div>

                {blockData.split_recommendation && blockData.split_recommendation.length > 0 && (
                    <Alert>
                        <AlertTriangle className="size-4 text-[var(--warning)]" />
                        <AlertDescription className="text-[12.5px]">
                            <span className="font-medium">Topic may be too large. </span>
                            Consider splitting into: {blockData.split_recommendation.join(', ')}
                        </AlertDescription>
                    </Alert>
                )}

                {blockData.merge_recommendation && (
                    <Alert>
                        <Info className="size-4 text-blue-500" />
                        <AlertDescription className="text-[12.5px]">
                            <span className="font-medium">Topic may be too small. </span>
                            Consider merging with: {blockData.merge_recommendation}
                        </AlertDescription>
                    </Alert>
                )}

                <BlockTree blocks={editedBlocks} onChange={setEditedBlocks} />

                <GenerationProgress status={streamStatus} message={streamMessage} />

                <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <CompoundGenerateButton
                        projectId={project.id}
                        stage="blocks"
                        resolvedModel={resolvedModel}
                        aiModels={aiModels}
                        currentStageOverrideId={project.blocks_model_id}
                        runOverrideId={runOverrideId}
                        onProjectUpdate={onProjectUpdate}
                        onRunOverrideChange={onRunOverrideChange}
                        label="Regenerate"
                        busy={isGenerating}
                        busyLabel="Regenerating"
                        disabled={isApproving}
                        onGenerate={() => setConfirmRegenOpen(true)}
                    />
                    <Button
                        onClick={handleApprove}
                        disabled={isApproving || isGenerating}
                        className="bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                    >
                        {isApproving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Approve structure
                    </Button>
                </div>

                <AlertDialog open={confirmRegenOpen} onOpenChange={setConfirmRegenOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-display">
                                Regenerate block structure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                The current blocks for{' '}
                                <span className="font-medium text-foreground">{topicTitle}</span>{' '}
                                will be replaced with a new AI generation. Any edits you&apos;ve
                                made will be lost. Approved blocks for other topics are unaffected.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleGenerate}
                                className="bg-[color:var(--honey)] text-background hover:opacity-90"
                            >
                                Regenerate
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return null;
}

export function StageBlocksPreview({ project, aiModels, resolvedModel, isActive, onProjectUpdate, onLogAppend }: StageBlocksPreviewProps) {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [generatingTopic, setGeneratingTopic] = useState<string | null>(null);
    const [runOverrideId, setRunOverrideId] = useState<string | null>(null);
    const { startStream } = useGenerationStream();
    const topics = getTopicList(project);

    if (topics.length === 0) {
        return (
            <PaperShell>
                <SectionEyebrow>Stage 03 · Block structure</SectionEyebrow>
                <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight">
                    No topics yet
                </h2>
                <p className="mt-1 text-[13.5px] text-muted-foreground">
                    Approve research (and optionally a scheme of work) before generating block structures.
                </p>
            </PaperShell>
        );
    }

    async function handleGenerate(topicKey: string) {
        setGeneratingTopic(topicKey);
        setSelectedKey(topicKey);
        try {
            const { job_id } = await csPost<{ job_id: string }>(
                runBlocks.url(project.id),
                {
                    topic_key: topicKey,
                    ...(runOverrideId && { model_id: runOverrideId }),
                },
            );
            startStream(
                project.id,
                job_id,
                (updatedProject, logEntry) => {
                    onProjectUpdate(updatedProject);
                    if (logEntry) onLogAppend(logEntry);
                    setGeneratingTopic(null);
                    setRunOverrideId(null);
                },
                (errorMsg) => {
                    sileo.error({ title: errorMsg });
                    setGeneratingTopic(null);
                },
            );
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
            setGeneratingTopic(null);
        }
    }

    const selectedTopic = topics.find((t) => t.key === selectedKey);
    const selectedBlockData: BlockStructureResult | null = selectedKey
        ? (project.ai_context?.blocks?.[selectedKey] ?? null)
        : null;

    const approvedCount = topics.filter((t) => t.status === 'approved').length;

    return (
        <PaperShell>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SectionEyebrow>Stage 03 · Block structure</SectionEyebrow>
                    <h2 className="mt-2 flex items-center gap-3 font-display text-[26px] font-semibold leading-tight tracking-tight">
                        <Blocks className="size-5 text-primary" />
                        Block structure
                    </h2>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">
                        Generate and approve hierarchical content blocks for each topic.
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <div className="font-display text-[24px] font-semibold leading-none tracking-tight">
                        {approvedCount}
                        <span className="text-muted-foreground">/{topics.length}</span>
                    </div>
                    <div className="section-label mt-1 uppercase tracking-[0.08em]">
                        approved
                    </div>
                </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 border-t border-dashed border-[var(--border)] pt-6 lg:grid-cols-[240px_1fr]">
                <aside>
                    <TopicProgressList
                        topics={topics}
                        selectedKey={selectedKey}
                        onSelect={setSelectedKey}
                        onGenerate={isActive ? handleGenerate : undefined}
                        generatingKey={generatingTopic}
                    />
                </aside>

                <div className="min-w-0">
                    {selectedTopic ? (
                        <BlockDetailPanel
                            project={project}
                            topicKey={selectedTopic.key}
                            topicTitle={selectedTopic.title}
                            status={selectedTopic.status}
                            blockData={selectedBlockData}
                            aiModels={aiModels}
                            resolvedModel={resolvedModel}
                            runOverrideId={runOverrideId}
                            onRunOverrideChange={setRunOverrideId}
                            onProjectUpdate={onProjectUpdate}
                            onLogAppend={onLogAppend}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                            <Blocks className="size-6 text-muted-foreground/30" />
                            <p className="text-[13px] text-muted-foreground">
                                Select a topic to view its block structure.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PaperShell>
    );
}
