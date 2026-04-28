'use no memo';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { CompoundGenerateButton } from './compound-generate-button';
import { BlockActionBar } from './block-action-bar';
import { StatusPill } from './status-pill';
import type { AIModelOption, ContentBlock, ContentProject, ResolvedStageModels } from '@/types/content-studio';
import type { TiptapJSON } from '@/types/tiptap';

export interface SaveContentPayload {
    content: TiptapJSON;
    word_count: number | null;
    nigerian_context_used: boolean | null;
}

interface BlockEditorProps {
    project: ContentProject;
    block: ContentBlock;
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    isBusy: boolean;
    onGenerate: (modelId: string | null) => void;
    onApprove: () => Promise<void>;
    onRegenerate: (modelId: string | null) => void;
    onSave: (payload: SaveContentPayload) => Promise<void>;
    onProjectUpdate: (project: ContentProject) => void;
    onRequestGuidance: () => void;
    onPrevBlock: (() => void) | null;
    onNextBlock: (() => void) | null;
}

export function BlockEditor({
    project,
    block,
    aiModels,
    resolvedModels,
    isBusy,
    onGenerate,
    onApprove,
    onRegenerate,
    onSave,
    onProjectUpdate,
    onRequestGuidance,
    onPrevBlock,
    onNextBlock,
}: BlockEditorProps) {
    const [editedContent, setEditedContent] = useState<TiptapJSON | null>(block.content);
    const [isEditing, setIsEditing] = useState(false);
    const [runOverrideId, setRunOverrideId] = useState<string | null>(null);

    useEffect(() => {
        setEditedContent(block.content);
        setIsEditing(false);
    }, [block.id, block.content]);

    const handleSave = useCallback(async () => {
        if (!editedContent) return;
        await onSave({
            content: editedContent,
            word_count: block.word_count,
            nigerian_context_used: block.nigerian_context_used,
        });
        setIsEditing(false);
    }, [editedContent, block.word_count, block.nigerian_context_used, onSave]);

    const handleSaveAndApprove = useCallback(async () => {
        await handleSave();
        await onApprove();
    }, [handleSave, onApprove]);

    return (
        <div className="paper-surface relative flex h-full min-w-0 flex-col">
            <div className="flex h-11 items-center justify-between border-b border-border bg-card/60 px-6 backdrop-blur-sm">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="tech">{block.path}</span>
                    <BlockStatusPill status={block.generation_status} />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={onPrevBlock ?? undefined}
                        disabled={!onPrevBlock}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                        aria-label="Previous block"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={onNextBlock ?? undefined}
                        disabled={!onNextBlock}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                        aria-label="Next block"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-[820px] px-8 py-8">
                    <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Block {block.path} · {block.difficulty_level ?? 'unspecified'}
                    </div>
                    <h2 className="mb-2 font-display text-[28px] font-bold leading-[1.15] tracking-tight">
                        {block.title}
                    </h2>
                    {block.summary_sentence && (
                        <p className="mb-8 text-[14px] leading-relaxed text-muted-foreground">
                            {block.summary_sentence}
                        </p>
                    )}

                    {block.generation_status === 'not_started' && !isBusy && (
                        <EmptyGenerateState
                            project={project}
                            block={block}
                            aiModels={aiModels}
                            resolvedModels={resolvedModels}
                            runOverrideId={runOverrideId}
                            setRunOverrideId={setRunOverrideId}
                            onGenerate={() => onGenerate(runOverrideId)}
                            onProjectUpdate={onProjectUpdate}
                            onRequestGuidance={onRequestGuidance}
                        />
                    )}

                    {(block.generation_status === 'generated' || block.generation_status === 'approved') && (
                        <>
                            {isEditing || block.generation_status === 'generated' ? (
                                <TiptapEditor
                                    value={editedContent}
                                    onChange={(json) => setEditedContent(json)}
                                    placeholder="Block content"
                                    disabled={isBusy}
                                />
                            ) : (
                                <ContentRenderer content={block.content} />
                            )}
                        </>
                    )}
                </div>
            </div>

            {(block.generation_status === 'generated' || block.generation_status === 'approved' || isEditing) && (
                <BlockActionBar
                    block={block}
                    isEditing={isEditing}
                    busy={isBusy}
                    onSave={handleSave}
                    onSaveAndApprove={handleSaveAndApprove}
                    onApprove={onApprove}
                    onRegenerate={() => onRegenerate(runOverrideId)}
                    onStartEdit={() => setIsEditing(true)}
                />
            )}
        </div>
    );
}

function BlockStatusPill({ status }: { status: ContentBlock['generation_status'] }) {
    if (status === 'approved') return <StatusPill tone="success">Approved</StatusPill>;
    if (status === 'generated') return <StatusPill tone="warning">Generated · awaiting approval</StatusPill>;
    return <StatusPill tone="neutral">Not started</StatusPill>;
}

interface EmptyGenerateStateProps {
    project: ContentProject;
    block: ContentBlock;
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    runOverrideId: string | null;
    setRunOverrideId: (id: string | null) => void;
    onGenerate: () => void;
    onProjectUpdate: (project: ContentProject) => void;
    onRequestGuidance: () => void;
}

function EmptyGenerateState({
    project,
    block,
    aiModels,
    resolvedModels,
    runOverrideId,
    setRunOverrideId,
    onGenerate,
    onProjectUpdate,
    onRequestGuidance,
}: EmptyGenerateStateProps) {
    const hasGuidance = !!block.content_guidance;

    if (!hasGuidance) {
        return (
            <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-border bg-card/50 p-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="text-[14px]">This block needs guidance before content can be generated.</span>
                </div>
                <Button onClick={onRequestGuidance}>
                    <PenLine className="mr-1.5 h-3.5 w-3.5" />
                    Add guidance
                </Button>
                <p className="text-[12px] text-muted-foreground">
                    Describe scope, key concepts, examples, and depth level. Opens in the Inspector panel.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-border bg-card/50 p-8">
            <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-[14px]">No content yet for this block.</span>
            </div>
            <CompoundGenerateButton
                projectId={project.id}
                stage="content"
                resolvedModel={resolvedModels.content}
                aiModels={aiModels}
                currentStageOverrideId={project.content_model_id}
                runOverrideId={runOverrideId}
                onProjectUpdate={onProjectUpdate}
                onRunOverrideChange={setRunOverrideId}
                label="Generate content"
                onGenerate={onGenerate}
            />
            <button
                type="button"
                onClick={onRequestGuidance}
                className="text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
                Edit guidance
            </button>
        </div>
    );
}
