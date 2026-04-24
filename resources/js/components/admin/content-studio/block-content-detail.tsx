'use no memo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
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
import { ContentRenderer } from '@/components/shared/content-renderer';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { DriftAdvisoryBanner } from './drift-advisory-banner';
import { StageModelSelector } from './stage-model-selector';
import { GenerationProgress } from './generation-progress';
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
    onProjectUpdate,
}: BlockContentDetailProps) {
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
        <div className="flex h-full flex-col gap-4 bg-card p-6">
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

            {/* Guidance */}
            {block.content_guidance && (
                <GuidanceView guidance={block.content_guidance} />
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
                <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-border bg-background p-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" aria-hidden />
                        <span className="text-sm">No content generated yet.</span>
                    </div>
                    <Button onClick={() => onGenerate(runOverrideId)} disabled={!block.content_guidance}>
                        Generate Content
                    </Button>
                    {!block.content_guidance && (
                        <p className="text-xs text-muted-foreground">
                            This block has no guidance set. Edit guidance before generating.
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

                    <MetadataPanel block={block} />

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

function GuidanceView({ guidance }: { guidance: string }) {
    return (
        <details className="group rounded-md border border-border bg-background px-3 py-2">
            <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Guidance
                <span className="ml-2 text-foreground group-open:hidden">→ show</span>
                <span className="ml-2 text-foreground hidden group-open:inline">↓ hide</span>
            </summary>
            <p className="pt-2 text-sm text-foreground">{guidance}</p>
        </details>
    );
}

function MetadataPanel({ block }: { block: ContentBlock }) {
    const terms = block.key_terms_introduced ?? [];
    const symbols = block.symbols_used ?? [];
    const formulas = block.formulas_used ?? [];

    if (!block.summary_sentence && terms.length === 0 && symbols.length === 0 && formulas.length === 0) {
        return null;
    }

    return (
        <details className="group rounded-md border border-border bg-background">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Generation metadata
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <span className="group-open:hidden">↓ expand</span>
                    <span className="hidden group-open:inline">↑ collapse</span>
                </span>
            </summary>
            <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
                {block.summary_sentence && (
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Summary</div>
                        <p className="pt-1 text-sm text-foreground">{block.summary_sentence}</p>
                    </div>
                )}
                {terms.length > 0 && (
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Key terms introduced</div>
                        <ul className="pt-1 space-y-1 text-sm text-foreground">
                            {terms.map((t) => (
                                <li key={t.term}>
                                    <span className="font-medium">{t.term}</span>
                                    <span className="text-muted-foreground"> — {t.definition}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {symbols.length > 0 && (
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Symbols</div>
                        <ul className="pt-1 space-y-1 text-sm text-foreground">
                            {symbols.map((s) => (
                                <li key={s.symbol}>
                                    <span className="font-mono">{s.symbol}</span>
                                    <span className="text-muted-foreground"> = {s.quantity} ({s.unit})</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {formulas.length > 0 && (
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Formulas</div>
                        <ul className="pt-1 space-y-1 font-mono text-xs text-foreground">
                            {formulas.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </details>
    );
}

function RegenerateWithConfirm({ onConfirm, destructive = false }: { onConfirm: () => void; destructive?: boolean }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant={destructive ? 'destructive' : 'outline'}>Regenerate</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate this block?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {destructive
                            ? 'This approved block will drop to the generated state and may flag downstream blocks if its key terms, symbols, or summary change.'
                            : 'The current content will be replaced.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Regenerate</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
