import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Loader2, Pencil } from 'lucide-react';
import { sileo } from 'sileo';
import { updateModels } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { csPut } from '@/lib/content-studio';
import { cn } from '@/lib/utils';
import type {
    AIModelOption,
    ContentProject,
    ModelResolutionSource,
    ResolvedStageModel,
    ResolvedStageModels,
} from '@/types/content-studio';

interface ProjectModelSummaryProps {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    platformDefaultModelId: string | null;
    onProjectUpdate: (project: ContentProject) => void;
}

const STAGE_ORDER: Array<keyof ResolvedStageModels> = ['research', 'scheme', 'blocks'];

const STAGE_LABELS: Record<keyof ResolvedStageModels, string> = {
    research: 'Research',
    scheme: 'Scheme',
    blocks: 'Blocks',
};

const INHERIT_VALUE = '__inherit__';

export function ProjectModelSummary({
    project,
    aiModels,
    resolvedModels,
    platformDefaultModelId,
    onProjectUpdate,
}: ProjectModelSummaryProps) {
    const projectDefault = useMemo(
        () => (project.default_ai_model_id ? aiModels.find((m) => m.id === project.default_ai_model_id) ?? null : null),
        [project.default_ai_model_id, aiModels],
    );

    const platformDefault = useMemo(
        () => (platformDefaultModelId ? aiModels.find((m) => m.id === platformDefaultModelId) ?? null : null),
        [platformDefaultModelId, aiModels],
    );

    if (aiModels.length === 0) {
        return null;
    }

    const effectiveDefault = projectDefault ?? platformDefault;
    const hasAnyDefault = !!effectiveDefault;

    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-lg border bg-card/60 shadow-sm',
                'backdrop-blur-[1px]',
            )}
            aria-label="AI model routing for this project"
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="flex flex-col gap-3 p-3 md:flex-row md:items-stretch md:gap-0 md:p-0">
                <div className="flex items-center gap-2 px-3 py-2.5 md:flex-col md:items-start md:justify-center md:px-4 md:py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        AI Routing
                    </span>
                    {!hasAnyDefault && (
                        <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300 reader:text-amber-300">
                            <AlertTriangle className="size-2.5" />
                            No default
                        </span>
                    )}
                </div>

                <div className="hidden w-px bg-border/60 md:block" aria-hidden />

                <div className="grid grid-cols-3 divide-x divide-border/60 md:flex-1">
                    {STAGE_ORDER.map((stage) => (
                        <StageReadout
                            key={stage}
                            label={STAGE_LABELS[stage]}
                            resolved={resolvedModels[stage]}
                        />
                    ))}
                </div>

                <div className="hidden w-px bg-border/60 md:block" aria-hidden />

                <DefaultControl
                    projectId={project.id}
                    currentDefaultId={project.default_ai_model_id}
                    aiModels={aiModels}
                    platformDefault={platformDefault}
                    projectDefault={projectDefault}
                    onProjectUpdate={onProjectUpdate}
                />
            </div>
        </section>
    );
}

interface StageReadoutProps {
    label: string;
    resolved: ResolvedStageModel;
}

function StageReadout({ label, resolved }: StageReadoutProps) {
    const tone = toneForSource(resolved.source);

    return (
        <div className="flex min-w-0 flex-col gap-0.5 px-3 py-2.5 md:px-4 md:py-3">
            <div className="flex items-center gap-2">
                <span
                    className={cn('size-1.5 shrink-0 rounded-full', tone.dot)}
                    aria-hidden
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/90">
                    {label}
                </span>
            </div>
            <p className="truncate text-xs font-semibold text-foreground md:text-sm" title={resolved.name}>
                {resolved.name}
            </p>
            <p className="truncate font-mono text-[10px] leading-tight text-muted-foreground/70">
                {resolved.model_id}
            </p>
            <p className={cn('truncate font-mono text-[10px] uppercase tracking-[0.14em]', tone.sourceText)}>
                {sourceLabel(resolved.source)}
            </p>
        </div>
    );
}

interface DefaultControlProps {
    projectId: string;
    currentDefaultId: string | null;
    aiModels: AIModelOption[];
    projectDefault: AIModelOption | null;
    platformDefault: AIModelOption | null;
    onProjectUpdate: (project: ContentProject) => void;
}

function DefaultControl({
    projectId,
    currentDefaultId,
    aiModels,
    projectDefault,
    platformDefault,
    onProjectUpdate,
}: DefaultControlProps) {
    const [open, setOpen] = useState(false);
    const [pickerValue, setPickerValue] = useState<string>(currentDefaultId ?? INHERIT_VALUE);
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setPickerValue(currentDefaultId ?? INHERIT_VALUE);
    }, [currentDefaultId]);

    useEffect(() => () => {
        if (savedTimeout.current) clearTimeout(savedTimeout.current);
    }, []);

    const label = projectDefault
        ? projectDefault.name
        : platformDefault
            ? platformDefault.name
            : 'No default';

    const subLabel = projectDefault
        ? 'project default'
        : platformDefault
            ? 'platform default'
            : 'fallback';

    const dotTone = projectDefault
        ? 'bg-primary'
        : platformDefault
            ? 'bg-muted-foreground/60'
            : 'bg-amber-500';

    const dirty = pickerValue !== (currentDefaultId ?? INHERIT_VALUE);

    async function handleSave() {
        setSaving(true);
        try {
            const { project } = await csPut<{ project: ContentProject; message: string }>(
                updateModels.url(projectId),
                { default_ai_model_id: pickerValue === INHERIT_VALUE ? null : pickerValue },
            );
            onProjectUpdate(project);
            setJustSaved(true);
            if (savedTimeout.current) clearTimeout(savedTimeout.current);
            savedTimeout.current = setTimeout(() => setJustSaved(false), 2200);
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Could not update project default' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'group flex items-center justify-between gap-3 px-3 py-2.5 text-left md:px-4 md:py-3',
                        'hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40',
                        'transition-colors',
                    )}
                >
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className={cn('size-1.5 rounded-full', dotTone)} aria-hidden />
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/90">
                                Default
                            </span>
                        </div>
                        <p className="truncate text-xs font-semibold text-foreground md:text-sm">
                            {label}
                        </p>
                        <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                            {subLabel}
                        </p>
                    </div>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors group-hover:border-foreground/30 group-hover:text-foreground">
                        <Pencil className="size-3" />
                    </span>
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-80" align="end">
                <div className="border-b px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Project default model
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/90">
                        Applies to any stage that hasn't been individually overridden.
                    </p>
                </div>

                <div className="space-y-3 p-4">
                    <Select value={pickerValue} onValueChange={setPickerValue}>
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={INHERIT_VALUE} className="text-xs">
                                <span className="flex items-baseline gap-2">
                                    <span className="font-medium">Inherit from platform</span>
                                    {platformDefault && (
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                            {platformDefault.name}
                                        </span>
                                    )}
                                </span>
                            </SelectItem>
                            {aiModels.map((m) => (
                                <SelectItem key={m.id} value={m.id} className="text-xs">
                                    <span className="flex items-baseline gap-2">
                                        <span>{m.name}</span>
                                        <span className="font-mono text-[10px] text-muted-foreground">
                                            {m.model_id}
                                        </span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-[10px] text-muted-foreground/80">
                            {pickerValue === INHERIT_VALUE
                                ? 'Will fall through to platform default.'
                                : 'Overrides the platform default for this project.'}
                        </p>
                        <button
                            type="button"
                            disabled={saving || !dirty}
                            onClick={handleSave}
                            className={cn(
                                'inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[11px] font-medium text-primary-foreground',
                                'transition-opacity hover:opacity-90',
                                'disabled:cursor-not-allowed disabled:opacity-50',
                            )}
                        >
                            {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                            Save
                        </button>
                    </div>
                </div>

                {justSaved && (
                    <div className="border-t bg-[var(--success)]/5 px-4 py-2">
                        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--success)]">
                            <Check className="size-3" />
                            Saved
                        </p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function toneForSource(source: ModelResolutionSource) {
    switch (source) {
        case 'stage_override':
            return { dot: 'bg-primary', sourceText: 'text-primary/80' };
        case 'project_default':
            return { dot: 'bg-muted-foreground/60', sourceText: 'text-muted-foreground/70' };
        case 'platform_default':
            return { dot: 'bg-muted-foreground/40', sourceText: 'text-muted-foreground/70' };
        case 'fallback':
            return {
                dot: 'bg-amber-500',
                sourceText: 'text-amber-700 dark:text-amber-300 reader:text-amber-300',
            };
    }
}

function sourceLabel(source: ModelResolutionSource): string {
    switch (source) {
        case 'stage_override':
            return 'Stage override';
        case 'project_default':
            return 'Inherits · project';
        case 'platform_default':
            return 'Inherits · platform';
        case 'fallback':
            return 'Fallback';
    }
}
