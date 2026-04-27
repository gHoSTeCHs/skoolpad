import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Bookmark, Check, ExternalLink } from 'lucide-react';
import { sileo } from 'sileo';
import * as AIModelAction from '@/actions/App/Http/Controllers/Admin/AIModelController';
import { updateModels } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { csPut } from '@/lib/content-studio';
import { cn } from '@/lib/utils';
import type { AIModelOption, ContentProject, ResolvedStageModel, ThinkingMode } from '@/types/content-studio';

export type Stage = 'research' | 'scheme' | 'blocks' | 'content';

const STAGE_COLUMN: Record<Stage, 'research_model_id' | 'scheme_model_id' | 'blocks_model_id' | 'content_model_id'> = {
    research: 'research_model_id',
    scheme: 'scheme_model_id',
    blocks: 'blocks_model_id',
    content: 'content_model_id',
};

const STAGE_LABEL: Record<Stage, string> = {
    research: 'research',
    scheme: 'scheme',
    blocks: 'block structure',
    content: 'content',
};

interface ModelPickerPopoverProps {
    projectId: string;
    stage: Stage;
    resolvedModel: ResolvedStageModel;
    aiModels: AIModelOption[];
    currentStageOverrideId: string | null;
    runOverrideId: string | null;
    onProjectUpdate: (project: ContentProject) => void;
    onRunOverrideChange: (modelId: string | null) => void;
    trigger: React.ReactNode;
}

export function ModelPickerPopover({
    projectId,
    stage,
    resolvedModel,
    aiModels,
    currentStageOverrideId,
    runOverrideId,
    onProjectUpdate,
    onRunOverrideChange,
    trigger,
}: ModelPickerPopoverProps) {
    const [open, setOpen] = useState(false);
    const [savingDefault, setSavingDefault] = useState(false);

    const groups = useMemo(() => {
        const map = new Map<string, AIModelOption[]>();
        for (const m of aiModels) {
            const key = m.provider_name;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(m);
        }
        return [...map.entries()];
    }, [aiModels]);

    const activeId = runOverrideId ?? currentStageOverrideId ?? resolvedModel.id;

    function selectModel(modelId: string) {
        onRunOverrideChange(modelId);
        setOpen(false);
    }

    async function saveAsDefault() {
        setSavingDefault(true);
        try {
            const { project } = await csPut<{ project: ContentProject; message: string }>(
                updateModels.url(projectId),
                { [STAGE_COLUMN[stage]]: activeId },
            );
            onProjectUpdate(project);
            onRunOverrideChange(null);
            sileo.success({ title: `Default model saved for ${STAGE_LABEL[stage]}` });
            setOpen(false);
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Could not save default' });
        } finally {
            setSavingDefault(false);
        }
    }

    const saveDisabled = savingDefault || (runOverrideId === null && currentStageOverrideId === activeId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-[360px] p-0" align="end">
                <div className="border-b border-border px-4 py-3">
                    <p className="text-[11.5px] text-muted-foreground/80">Use for this generation</p>
                    <p className="mt-1 font-display text-[14px] font-semibold">Pick a model</p>
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                    {groups.map(([providerName, models]) => (
                        <div key={providerName}>
                            <div className="px-4 pt-3 pb-1">
                                <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/70">
                                    {providerName}
                                </div>
                            </div>
                            {models.map((m) => {
                                const isActive = m.id === activeId;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectModel(m.id)}
                                        className="flex w-full items-center justify-between px-4 py-2 transition-colors hover:bg-muted"
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <span
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full',
                                                    isActive ? 'bg-primary' : 'border border-muted-foreground/40 bg-transparent',
                                                )}
                                            />
                                            <span className={cn('text-[13.5px]', isActive && 'font-medium')}>{m.name}</span>
                                            <ThinkingChip mode={m.thinking_mode} />
                                        </span>
                                        {isActive && <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-border bg-background/40 px-4 py-2.5">
                    <button
                        type="button"
                        disabled={saveDisabled}
                        onClick={saveAsDefault}
                        className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    >
                        <Bookmark className="h-3 w-3" />
                        Save as default for {STAGE_LABEL[stage]}
                    </button>
                    <Link
                        href={AIModelAction.index.url()}
                        className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground/80 transition-colors hover:text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Manage models
                        <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function ThinkingChip({ mode }: { mode: ThinkingMode }) {
    if (mode === 'none') return null;
    const isMax = mode === 'max';
    return (
        <span
            className={cn(
                'inline-flex items-center rounded px-1 py-px text-[10px] font-medium uppercase tracking-wide',
                isMax
                    ? 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]'
                    : 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
            )}
        >
            {isMax ? 'think max' : 'think'}
        </span>
    );
}
