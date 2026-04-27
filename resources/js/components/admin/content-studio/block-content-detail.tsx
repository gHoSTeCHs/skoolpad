'use no memo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, PenLine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { DriftAdvisoryBanner } from './drift-advisory-banner';
import { StageModelSelector } from './stage-model-selector';
import { GenerationProgress } from './generation-progress';
import { BlockMetadataPanel } from './block-metadata-panel';
import { RegenerateWithConfirm } from './regenerate-with-confirm';
import type { AIModelOption, ContentBlock, ContentProject, ResolvedStageModels } from '@/types/content-studio';
import type { TiptapJSON } from '@/types/tiptap';

interface BlockContentDetailProps {
    project: ContentProject;
    block: ContentBlock;
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    isBusy: boolean;
    busyMessage: string;
    busyStatus: 'idle' | 'processing' | 'validating' | 'complete' | 'error';
    onGenerate: (modelId: string | null) => void;
    onApprove: () => Promise<void>;
    onRegenerate: (modelId: string | null) => void;
    onSave: (payload: SaveContentPayload) => Promise<void>;
    onDismissAdvisory: () => void;
    onUpdateGuidance: (guidance: string) => Promise<void>;
    onProjectUpdate: (project: ContentProject) => void;
}

export interface SaveContentPayload {
    content: TiptapJSON;
    word_count: number | null;
    nigerian_context_used: boolean | null;
}

export function BlockContentDetail({
    project,
    block,
    aiModels,
    resolvedModels,
    isBusy,
    busyMessage,
    busyStatus,
    onGenerate,
    onApprove,
    onRegenerate,
    onSave,
    onDismissAdvisory,
    onUpdateGuidance,
    onProjectUpdate,
}: BlockContentDetailProps) {
    const [editedContent, setEditedContent] = useState<TiptapJSON | null>(block.content);
    const [isEditing, setIsEditing] = useState(false);
    const [runOverrideId, setRunOverrideId] = useState<string | null>(null);
    const [isEditingGuidance, setIsEditingGuidance] = useState(false);
    const [guidanceDraft, setGuidanceDraft] = useState('');
    const [isSavingGuidance, setIsSavingGuidance] = useState(false);

    useEffect(() => {
        setEditedContent(block.content);
        setIsEditing(false);
        setIsEditingGuidance(false);
    }, [block.id, block.content]);

    const handleStartEditGuidance = useCallback(() => {
        setGuidanceDraft(block.content_guidance ?? '');
        setIsEditingGuidance(true);
    }, [block.content_guidance]);

    const handleSaveGuidance = useCallback(async () => {
        if (!guidanceDraft.trim()) return;
        setIsSavingGuidance(true);
        try {
            await onUpdateGuidance(guidanceDraft.trim());
            setIsEditingGuidance(false);
        } finally {
            setIsSavingGuidance(false);
        }
    }, [guidanceDraft, onUpdateGuidance]);

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

    const metadataChips = useMemo(
        () =>
            [
                block.difficulty_level && { label: block.difficulty_level },
                block.bloom_level && { label: block.bloom_level },
                block.estimated_read_time && { label: `${block.estimated_read_time} min read` },
                block.word_count && { label: `${block.word_count} words` },
            ].filter(Boolean) as Array<{ label: string }>,
        [block],
    );

    return (
        <div className="flex flex-col gap-4 bg-card p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {block.path}
                        </span>
                        <StatusDot status={block.generation_status} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{block.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {metadataChips.map((chip) => (
                            <span
                                key={chip.label}
                                className="font-mono text-[10px] uppercase tracking-[0.14em] rounded-sm border border-border bg-background px-1.5 py-0.5 text-muted-foreground"
                            >
                                {chip.label}
                            </span>
                        ))}
                    </div>
                </div>

                <StageModelSelector
                    projectId={project.id}
                    stage="content"
                    resolvedModel={resolvedModels.content}
                    aiModels={aiModels}
                    currentStageOverrideId={project.content_model_id}
                    runOverrideId={runOverrideId}
                    onProjectUpdate={onProjectUpdate}
                    onRunOverrideChange={setRunOverrideId}
                    disabled={isBusy}
                />
            </div>

            {/* Guidance — always visible; editable when null */}
            {isEditingGuidance ? (
                <GuidanceEditor
                    value={guidanceDraft}
                    onChange={setGuidanceDraft}
                    onSave={handleSaveGuidance}
                    onCancel={() => setIsEditingGuidance(false)}
                    isSaving={isSavingGuidance}
                />
            ) : block.content_guidance ? (
                <GuidanceView guidance={block.content_guidance} onEdit={handleStartEditGuidance} />
            ) : (
                <GuidanceEmptyState onAdd={handleStartEditGuidance} />
            )}

            {/* Drift advisory */}
            {block.drift_advisory && (
                <DriftAdvisoryBanner
                    advisory={block.drift_advisory}
                    onDismiss={onDismissAdvisory}
                    onRegenerate={() => onRegenerate(runOverrideId)}
                    isBusy={isBusy}
                />
            )}

            {/* Busy state */}
            {isBusy && (
                <GenerationProgress status={busyStatus} message={busyMessage} />
            )}

            {/* Body — switches on generation_status */}
            {block.generation_status === 'not_started' && !isBusy && (
                <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-background p-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" aria-hidden />
                        <span className="text-sm">No content generated yet.</span>
                    </div>
                    <Button onClick={() => onGenerate(runOverrideId)} disabled={!block.content_guidance || isEditingGuidance}>
                        Generate Content
                    </Button>
                    {!block.content_guidance && !isEditingGuidance && (
                        <p className="text-xs text-muted-foreground">
                            Add guidance above before generating.
                        </p>
                    )}
                </div>
            )}

            {(block.generation_status === 'generated' || block.generation_status === 'approved') && !isBusy && (
                <>
                    {isEditing || block.generation_status === 'generated' ? (
                        <TiptapEditor
                            value={editedContent}
                            onChange={(json) => setEditedContent(json)}
                            placeholder="Block content"
                            disabled={false}
                        />
                    ) : (
                        <div className="rounded-md border border-border bg-background p-6">
                            <ContentRenderer content={block.content} />
                        </div>
                    )}

                    <BlockMetadataPanel block={block} variant="inline-details" />

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {block.generation_status === 'approved' && !isEditing && (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                                <RegenerateWithConfirm onConfirm={() => onRegenerate(runOverrideId)} destructive />
                            </>
                        )}
                        {(block.generation_status === 'generated' || isEditing) && (
                            <>
                                <Button variant="outline" onClick={handleSave}>Save</Button>
                                <Button variant="outline" onClick={handleSaveAndApprove}>Save + Approve</Button>
                                <Button onClick={() => onApprove()}>Approve</Button>
                                <RegenerateWithConfirm onConfirm={() => onRegenerate(runOverrideId)} />
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function StatusDot({ status }: { status: ContentBlock['generation_status'] }) {
    const tone =
        status === 'approved' ? 'bg-[color:var(--color-success)]' :
        status === 'generated' ? 'bg-[color:var(--color-warning)]' :
        'bg-muted-foreground/40';
    const label =
        status === 'approved' ? 'Approved' :
        status === 'generated' ? 'Generated' :
        'Not started';
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${tone}`} aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        </span>
    );
}

function GuidanceEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center gap-2.5 rounded-md border border-dashed border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
            <PenLine className="h-3.5 w-3.5 flex-none text-muted-foreground" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                No guidance — click to add
            </span>
        </button>
    );
}

function GuidanceEditor({
    value,
    onChange,
    onSave,
    onCancel,
    isSaving,
}: {
    value: string;
    onChange: (v: string) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useEffect(() => { ref.current?.focus(); }, []);

    return (
        <div className="rounded-md border border-primary/40 bg-background ring-1 ring-primary/20">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Guidance</span>
                <button type="button" onClick={onCancel} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" aria-hidden />
                </button>
            </div>
            <textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Describe what this block should cover — scope, key concepts, examples, depth level..."
                rows={4}
                className="w-full resize-y bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <div className="flex items-center gap-2 border-t border-border px-3 py-2">
                <Button size="sm" onClick={onSave} disabled={!value.trim() || isSaving}>
                    {isSaving ? 'Saving…' : 'Save guidance'}
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

function GuidanceView({ guidance, onEdit }: { guidance: string; onEdit: () => void }) {
    return (
        <details className="group rounded-md border border-border bg-background">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Guidance
                    <span className="ml-2 opacity-60 group-open:hidden">↓ show</span>
                    <span className="ml-2 opacity-60 hidden group-open:inline">↑ hide</span>
                </span>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); onEdit(); }}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
                >
                    Edit
                </button>
            </summary>
            <p className="border-t border-border px-3 py-2.5 text-sm text-foreground">{guidance}</p>
        </details>
    );
}


