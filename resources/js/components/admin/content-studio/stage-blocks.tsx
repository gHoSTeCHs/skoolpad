import {
    AlertTriangle,
    Blocks,
    Check,
    Info,
    Loader2,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { sileo } from 'sileo';
import {
    runBlocks,
    approveBlocks,
} from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { BlockTree } from '@/components/admin/content-studio/block-tree';
import { GenerationProgress } from '@/components/admin/content-studio/generation-progress';
import { StageModelSelector } from '@/components/admin/content-studio/stage-model-selector';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

interface StageBlocksProps {
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

    useEffect(() => {
        setEditedBlocks(blockData?.blocks ?? []);
    }, [blockData]);
    const { status: streamStatus, message: streamMessage, startStream } = useGenerationStream();
    const isGenerating = streamStatus === 'processing' || streamStatus === 'validating';
    const runOverrideModel = runOverrideId ? aiModels.find((m) => m.id === runOverrideId) : null;

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
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Request failed' });
        } finally {
            setIsApproving(false);
        }
    }

    if (status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div
                    className="rounded-2xl border-2 border-dashed border-muted-foreground/20 p-5"
                >
                    <Blocks
                        className="size-6 text-muted-foreground/40"
                        style={{ animation: 'empty-pulse 3s ease-in-out infinite' }}
                    />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                        {topicTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        AI will generate a hierarchical content structure for this topic
                    </p>
                </div>
                <GenerationProgress status={streamStatus} message={streamMessage} />
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <StageModelSelector
                        projectId={project.id}
                        stage="blocks"
                        resolvedModel={resolvedModel}
                        aiModels={aiModels}
                        currentStageOverrideId={project.blocks_model_id}
                        runOverrideId={runOverrideId}
                        onProjectUpdate={onProjectUpdate}
                        onRunOverrideChange={onRunOverrideChange}
                        disabled={isGenerating}
                    />
                    <Button onClick={handleGenerate} disabled={isGenerating} size="lg">
                        {isGenerating ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="size-4" />
                                {runOverrideModel ? `Generate with ${runOverrideModel.name}` : 'Generate Block Structure'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'approved' && blockData) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-[var(--badge-primary-bg)]/30 px-3 py-2 text-sm font-medium text-[var(--badge-primary-fg)] dark:bg-emerald-900/10 dark:text-emerald-400 reader:bg-emerald-900/10 reader:text-emerald-400">
                    <Check className="size-4" />
                    {topicTitle} — Approved
                </div>
                <div className="text-xs text-muted-foreground">
                    {blockData.total_leaf_blocks} blocks ·{' '}
                    {blockData.estimated_total_minutes} min total
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
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-medium">{topicTitle}</h4>
                        <p className="text-xs text-muted-foreground">
                            {leafCount} blocks · {totalMinutes} min total
                        </p>
                    </div>
                </div>

                {blockData.split_recommendation &&
                    blockData.split_recommendation.length > 0 && (
                        <Alert>
                            <AlertTriangle className="size-4 text-[var(--warning)]" />
                            <AlertDescription className="text-xs">
                                <span className="font-medium">
                                    Topic may be too large.{' '}
                                </span>
                                Consider splitting into:{' '}
                                {blockData.split_recommendation.join(', ')}
                            </AlertDescription>
                        </Alert>
                    )}

                {blockData.merge_recommendation && (
                    <Alert>
                        <Info className="size-4 text-blue-500" />
                        <AlertDescription className="text-xs">
                            <span className="font-medium">
                                Topic may be too small.{' '}
                            </span>
                            Consider merging with:{' '}
                            {blockData.merge_recommendation}
                        </AlertDescription>
                    </Alert>
                )}

                <BlockTree blocks={editedBlocks} onChange={setEditedBlocks} />

                <GenerationProgress status={streamStatus} message={streamMessage} />

                <Separator />

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <StageModelSelector
                            projectId={project.id}
                            stage="blocks"
                            resolvedModel={resolvedModel}
                            aiModels={aiModels}
                            currentStageOverrideId={project.blocks_model_id}
                            runOverrideId={runOverrideId}
                            onProjectUpdate={onProjectUpdate}
                            onRunOverrideChange={onRunOverrideChange}
                            disabled={isGenerating || isApproving}
                        />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isGenerating || isApproving}
                                    className="border-amber-500/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 reader:text-amber-300 reader:hover:text-amber-200"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="size-4" />
                                    )}
                                    Regenerate
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="font-display">
                                        Regenerate block structure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        The current blocks for <span className="font-medium text-foreground">{topicTitle}</span> will be replaced with a new AI generation. Any edits you&apos;ve made will be lost. Approved blocks for other topics are unaffected.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleGenerate}
                                        className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 reader:bg-amber-500 reader:hover:bg-amber-600"
                                    >
                                        {runOverrideModel ? `Regenerate with ${runOverrideModel.name}` : 'Regenerate'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <Button
                        onClick={handleApprove}
                        disabled={isApproving || isGenerating}
                        className="bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                    >
                        {isApproving ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Check className="size-4" />
                        )}
                        Approve Structure
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}

export function StageBlocks({ project, aiModels, resolvedModel, isActive, onProjectUpdate, onLogAppend }: StageBlocksProps) {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [generatingTopic, setGeneratingTopic] = useState<string | null>(null);
    const [runOverrideId, setRunOverrideId] = useState<string | null>(null);
    const { startStream } = useGenerationStream();
    const topics = getTopicList(project);

    if (topics.length === 0) {
        return null;
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
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 font-display text-base">
                            <Blocks className="size-4 text-primary" />
                            Block Structure
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Generate and approve content block hierarchies for
                            each topic.
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium">
                            {approvedCount}/{topics.length}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                            approved
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="w-full shrink-0 sm:w-56">
                        <TopicProgressList
                            topics={topics}
                            selectedKey={selectedKey}
                            onSelect={setSelectedKey}
                            onGenerate={handleGenerate}
                            generatingKey={generatingTopic}
                        />
                    </div>

                    <Separator
                        orientation="vertical"
                        className="hidden sm:block"
                    />
                    <Separator className="sm:hidden" />

                    <div className="min-w-0 flex-1">
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
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                                <Blocks className="size-6 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">
                                    Select a topic to view its block structure
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
