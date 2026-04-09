import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Blocks,
    Check,
    Info,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { runBlocks, approveBlocks } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { BlockTree } from '@/components/admin/content-studio/block-tree';
import { TopicProgressList } from '@/components/admin/content-studio/topic-progress-list';
import { slugify } from '@/lib/slug';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BlockNode, BlockStructureResult, ContentProject } from '@/types/content-studio';

interface StageBlocksProps {
    project: ContentProject;
    isActive: boolean;
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
        status: approved[key] ? 'approved' : blocks[key] ? 'generated' : 'pending',
    }));
}

function BlockDetailPanel({
    project,
    topicKey,
    topicTitle,
    status,
    blockData,
}: {
    project: ContentProject;
    topicKey: string;
    topicTitle: string;
    status: 'pending' | 'generated' | 'approved';
    blockData: BlockStructureResult | null;
}) {
    const [editedBlocks, setEditedBlocks] = useState<BlockNode[]>(blockData?.blocks ?? []);
    const [isApproving, setIsApproving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    function handleGenerate() {
        setIsGenerating(true);
        router.post(
            runBlocks.url(project.id),
            { topic_key: topicKey },
            {
                preserveScroll: true,
                onFinish: () => setIsGenerating(false),
            },
        );
    }

    function handleApprove() {
        if (!blockData) return;
        setIsApproving(true);
        router.post(
            approveBlocks.url(project.id),
            {
                topic_key: topicKey,
                topic_title: blockData.topic_title,
                topic_slug: blockData.topic_slug,
                topic_summary: blockData.topic_summary,
                estimated_total_minutes: blockData.estimated_total_minutes,
                blocks: editedBlocks,
            } as never,
            {
                preserveScroll: true,
                onFinish: () => setIsApproving(false),
            },
        );
    }

    if (status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                    <Blocks className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                    No block structure generated for <span className="font-medium text-foreground">{topicTitle}</span>
                </p>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="size-4" />
                            Generate Block Structure
                        </>
                    )}
                </Button>
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
                    {blockData.total_leaf_blocks} blocks · {blockData.estimated_total_minutes} min total
                    {blockData.total_visualization_flags > 0 && ` · ${blockData.total_visualization_flags} visualizations`}
                </div>
                <BlockTree blocks={blockData.blocks} onChange={() => {}} readOnly />
            </div>
        );
    }

    if (status === 'generated' && blockData) {
        const leafCount = editedBlocks.filter((b) => !b.is_container).length;
        const totalMinutes = editedBlocks.reduce((sum, b) => sum + (b.estimated_read_time ?? 0), 0);

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

                {blockData.split_recommendation && blockData.split_recommendation.length > 0 && (
                    <Alert>
                        <AlertTriangle className="size-4 text-[var(--warning)]" />
                        <AlertDescription className="text-xs">
                            <span className="font-medium">Topic may be too large. </span>
                            Consider splitting into: {blockData.split_recommendation.join(', ')}
                        </AlertDescription>
                    </Alert>
                )}

                {blockData.merge_recommendation && (
                    <Alert>
                        <Info className="size-4 text-blue-500" />
                        <AlertDescription className="text-xs">
                            <span className="font-medium">Topic may be too small. </span>
                            Consider merging with: {blockData.merge_recommendation}
                        </AlertDescription>
                    </Alert>
                )}

                <BlockTree blocks={editedBlocks} onChange={setEditedBlocks} />

                <Separator />

                <div className="flex items-center justify-end gap-2">
                    <Button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
                    >
                        {isApproving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Approve Structure
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}

export function StageBlocks({ project, isActive }: StageBlocksProps) {
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [generatingTopic, setGeneratingTopic] = useState<string | null>(null);
    const topics = getTopicList(project);

    if (topics.length === 0) {
        return null;
    }

    function handleGenerate(topicKey: string) {
        setGeneratingTopic(topicKey);
        setSelectedKey(topicKey);
        router.post(
            runBlocks.url(project.id),
            { topic_key: topicKey },
            {
                preserveScroll: true,
                onFinish: () => setGeneratingTopic(null),
            },
        );
    }

    const selectedTopic = topics.find((t) => t.key === selectedKey);
    const selectedBlockData: BlockStructureResult | null =
        selectedKey ? (project.ai_context?.blocks?.[selectedKey] ?? null) : null;

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
                            Generate and approve content block hierarchies for each topic.
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium">{approvedCount}/{topics.length}</span>
                        <span className="ml-1 text-xs text-muted-foreground">approved</span>
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

                    <Separator orientation="vertical" className="hidden sm:block" />
                    <Separator className="sm:hidden" />

                    <div className="min-w-0 flex-1">
                        {selectedTopic ? (
                            <BlockDetailPanel
                                project={project}
                                topicKey={selectedTopic.key}
                                topicTitle={selectedTopic.title}
                                status={selectedTopic.status}
                                blockData={selectedBlockData}
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
