import { useMemo, useState } from 'react';
import { Bookmark, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { sileo } from 'sileo';
import { updateModels } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { csPut } from '@/lib/content-studio';
import { cn } from '@/lib/utils';
import type { AIModelOption, ContentProject, ResolvedStageModel } from '@/types/content-studio';

interface ProjectDefaultModelChipProps {
    projectId: string;
    currentDefaultId: string | null;
    platformDefaultModelId: string | null;
    aiModels: AIModelOption[];
    resolvedDefaultModel: ResolvedStageModel;
    onProjectUpdate: (project: ContentProject) => void;
}

export function ProjectDefaultModelChip({
    projectId,
    currentDefaultId,
    platformDefaultModelId,
    aiModels,
    resolvedDefaultModel,
    onProjectUpdate,
}: ProjectDefaultModelChipProps) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const groups = useMemo(() => {
        const map = new Map<string, AIModelOption[]>();
        for (const m of aiModels) {
            const key = m.provider_name;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(m);
        }
        return [...map.entries()];
    }, [aiModels]);

    const platformDefault = aiModels.find((m) => m.id === platformDefaultModelId) ?? null;
    const isProjectOverride = currentDefaultId !== null;

    async function persist(modelId: string | null) {
        setSaving(true);
        try {
            const { project } = await csPut<{ project: ContentProject; message: string }>(
                updateModels.url(projectId),
                { default_ai_model_id: modelId },
            );
            onProjectUpdate(project);
            sileo.success({ title: modelId ? 'Project default saved' : 'Reverted to platform default' });
            setOpen(false);
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Could not update project default' });
        } finally {
            setSaving(false);
        }
    }

    const sourceLabel =
        resolvedDefaultModel.source === 'project_default'
            ? 'project default'
            : resolvedDefaultModel.source === 'platform_default'
              ? 'platform default'
              : resolvedDefaultModel.source;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-[12.5px] font-medium transition-colors hover:border-border/70"
                    title={`Default model · resolved via ${resolvedDefaultModel.source}`}
                >
                    <span className={cn('h-1.5 w-1.5 rounded-full', isProjectOverride ? 'bg-primary' : 'bg-muted-foreground/60')} />
                    <span>{resolvedDefaultModel.name}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-[360px] p-0" align="end">
                <div className="border-b border-border px-4 py-3">
                    <p className="text-[11.5px] text-muted-foreground/80">Project default model</p>
                    <p className="mt-1 font-display text-[14px] font-semibold">Pick a default</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                        Used for any stage without an explicit override. Currently:{' '}
                        <span className="tech">{sourceLabel}</span>.
                    </p>
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
                                const isActive = m.id === resolvedDefaultModel.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        disabled={saving}
                                        onClick={() => persist(m.id)}
                                        className="flex w-full items-center justify-between px-4 py-2 transition-colors hover:bg-muted disabled:opacity-50"
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <span
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full',
                                                    isActive ? 'bg-primary' : 'border border-muted-foreground/40 bg-transparent',
                                                )}
                                            />
                                            <span className={cn('text-[13.5px]', isActive && 'font-medium')}>{m.name}</span>
                                        </span>
                                        {isActive && <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {isProjectOverride && (
                    <div className="border-t border-border px-4 py-2.5">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => persist(null)}
                            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Inherit from platform default
                            {platformDefault && <span className="tech ml-1">({platformDefault.name})</span>}
                        </button>
                    </div>
                )}

                {!isProjectOverride && resolvedDefaultModel.id && (
                    <div className="flex items-center gap-1.5 border-t border-border bg-background/40 px-4 py-2 text-[11.5px] text-muted-foreground">
                        <Bookmark className="h-3 w-3" />
                        Selecting a model saves it as the project default.
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
