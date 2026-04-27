import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Zap } from 'lucide-react';
import { sileo } from 'sileo';
import { updateModels } from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { csPut } from '@/lib/content-studio';
import { cn } from '@/lib/utils';
import type {
    AIModelOption,
    ContentProject,
    ModelResolutionSource,
    ResolvedStageModel,
    ThinkingMode,
} from '@/types/content-studio';

type Stage = 'research' | 'scheme' | 'blocks' | 'content';
type Mode = 'default' | 'stage' | 'run';

interface StageModelSelectorProps {
    projectId: string;
    stage: Stage;
    resolvedModel: ResolvedStageModel;
    aiModels: AIModelOption[];
    currentStageOverrideId: string | null;
    runOverrideId: string | null;
    onProjectUpdate: (project: ContentProject) => void;
    onRunOverrideChange: (modelId: string | null) => void;
    disabled?: boolean;
}

const STAGE_COLUMN: Record<Stage, 'research_model_id' | 'scheme_model_id' | 'blocks_model_id' | 'content_model_id'> = {
    research: 'research_model_id',
    scheme: 'scheme_model_id',
    blocks: 'blocks_model_id',
    content: 'content_model_id',
};

const STAGE_LABEL: Record<Stage, string> = {
    research: 'research',
    scheme: 'scheme of work',
    blocks: 'block structure',
    content: 'content',
};

const SOURCE_LABEL: Record<ModelResolutionSource, string> = {
    stage_override: 'stage override',
    project_default: 'project default',
    platform_default: 'platform default',
    fallback: 'fallback',
};

export function StageModelSelector({
    projectId,
    stage,
    resolvedModel,
    aiModels,
    currentStageOverrideId,
    runOverrideId,
    onProjectUpdate,
    onRunOverrideChange,
    disabled = false,
}: StageModelSelectorProps) {
    const initialMode: Mode = runOverrideId ? 'run' : currentStageOverrideId ? 'stage' : 'default';

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>(initialMode);
    const [pickerValue, setPickerValue] = useState<string>(
        runOverrideId ?? currentStageOverrideId ?? resolvedModel.id,
    );
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setMode(runOverrideId ? 'run' : currentStageOverrideId ? 'stage' : 'default');
        setPickerValue(runOverrideId ?? currentStageOverrideId ?? resolvedModel.id);
    }, [runOverrideId, currentStageOverrideId, resolvedModel.id]);

    useEffect(() => () => {
        if (savedTimeout.current) clearTimeout(savedTimeout.current);
    }, []);

    const chip = useMemo(() => deriveChip(resolvedModel, currentStageOverrideId, runOverrideId, aiModels), [
        resolvedModel,
        currentStageOverrideId,
        runOverrideId,
        aiModels,
    ]);

    async function persistStageOverride(modelId: string | null) {
        setSaving(true);
        try {
            const { project } = await csPut<{ project: ContentProject; message: string }>(
                updateModels.url(projectId),
                { [STAGE_COLUMN[stage]]: modelId },
            );
            onProjectUpdate(project);
            onRunOverrideChange(null);
            setJustSaved(true);
            if (savedTimeout.current) clearTimeout(savedTimeout.current);
            savedTimeout.current = setTimeout(() => setJustSaved(false), 2200);
        } catch (e) {
            sileo.error({ title: e instanceof Error ? e.message : 'Could not save model preference' });
        } finally {
            setSaving(false);
        }
    }

    function applyRunOverride(modelId: string) {
        onRunOverrideChange(modelId);
        setOpen(false);
    }

    function resetToDefault() {
        if (currentStageOverrideId) {
            void persistStageOverride(null);
        }
        onRunOverrideChange(null);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        'group inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs transition-colors',
                        'hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        chip.container,
                    )}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                >
                    <span
                        className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            chip.dot,
                            chip.pulse && 'animate-pulse',
                        )}
                        aria-hidden
                    />
                    <span className="flex items-center gap-1.5 font-body">
                        {chip.prefix && (
                            <span className={cn('font-mono text-[10px] uppercase tracking-[0.12em]', chip.prefixTone)}>
                                {chip.prefix}
                            </span>
                        )}
                        <span className="max-w-[10rem] truncate font-medium text-foreground">{chip.name}</span>
                    </span>
                    {chip.source && (
                        <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80 sm:inline">
                            {chip.source}
                        </span>
                    )}
                    <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-[22rem]" align="end">
                <div className="border-b px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Model for {STAGE_LABEL[stage]}
                    </p>
                    <p className="mt-1 font-display text-sm font-semibold text-foreground">
                        {resolvedModel.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
                        {resolvedModel.model_id} · resolved via {SOURCE_LABEL[resolvedModel.source]}
                    </p>
                </div>

                <div className="divide-y divide-border/60">
                    <ModeRow
                        value="default"
                        mode={mode}
                        title="Use default"
                        hint={`Falls back to ${SOURCE_LABEL[resolvedModel.source]}`}
                        onSelect={() => {
                            setMode('default');
                            resetToDefault();
                        }}
                        disabled={mode === 'default' && !currentStageOverrideId && !runOverrideId}
                    />
                    <ModeRow
                        value="stage"
                        mode={mode}
                        title="Always use for this stage"
                        hint="Saved to the project. Affects future runs."
                        onSelect={() => {
                            setMode('stage');
                            if (!aiModels.some((m) => m.id === pickerValue)) {
                                setPickerValue(aiModels[0]?.id ?? resolvedModel.id);
                            }
                        }}
                    >
                        {mode === 'stage' && (
                            <div className="mt-2 flex items-center gap-2">
                                <Select value={pickerValue} onValueChange={setPickerValue}>
                                    <SelectTrigger className="h-8 flex-1 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <GroupedModelList aiModels={aiModels} />
                                    </SelectContent>
                                </Select>
                                <button
                                    type="button"
                                    disabled={saving || pickerValue === currentStageOverrideId}
                                    onClick={() => void persistStageOverride(pickerValue)}
                                    className={cn(
                                        'inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground',
                                        'transition-opacity hover:opacity-90',
                                        'disabled:cursor-not-allowed disabled:opacity-50',
                                    )}
                                >
                                    {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                                    Save
                                </button>
                            </div>
                        )}
                    </ModeRow>
                    <ModeRow
                        value="run"
                        mode={mode}
                        title="Just this run"
                        hint="Ephemeral. Not remembered."
                        accent="honey"
                        onSelect={() => {
                            setMode('run');
                            if (!aiModels.some((m) => m.id === pickerValue)) {
                                setPickerValue(aiModels[0]?.id ?? resolvedModel.id);
                            }
                        }}
                    >
                        {mode === 'run' && (
                            <div className="mt-2 flex items-center gap-2">
                                <Select value={pickerValue} onValueChange={setPickerValue}>
                                    <SelectTrigger className="h-8 flex-1 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <GroupedModelList aiModels={aiModels} />
                                    </SelectContent>
                                </Select>
                                <button
                                    type="button"
                                    onClick={() => applyRunOverride(pickerValue)}
                                    className="inline-flex h-8 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 text-[11px] font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 reader:text-amber-300"
                                >
                                    <Zap className="size-3" />
                                    Apply
                                </button>
                            </div>
                        )}
                    </ModeRow>
                </div>

                {justSaved && (
                    <div className="border-t bg-[var(--success)]/5 px-4 py-2">
                        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--success)]">
                            <Check className="size-3" />
                            Saved · applies to future runs
                        </p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

interface ModeRowProps {
    value: Mode;
    mode: Mode;
    title: string;
    hint: string;
    onSelect: () => void;
    accent?: 'honey';
    disabled?: boolean;
    children?: React.ReactNode;
}

function ModeRow({ value, mode, title, hint, onSelect, accent, disabled, children }: ModeRowProps) {
    const selected = mode === value;

    return (
        <div className={cn('px-4 py-3', selected && 'bg-muted/30')}>
            <button
                type="button"
                onClick={onSelect}
                disabled={disabled}
                className="flex w-full items-start gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span
                    className={cn(
                        'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors',
                        selected
                            ? accent === 'honey'
                                ? 'border-amber-500 bg-amber-500/20'
                                : 'border-primary bg-primary/20'
                            : 'border-border bg-background',
                    )}
                    aria-hidden
                >
                    <span
                        className={cn(
                            'size-1.5 rounded-full transition-all',
                            selected
                                ? accent === 'honey'
                                    ? 'bg-amber-500'
                                    : 'bg-primary'
                                : 'bg-transparent',
                        )}
                    />
                </span>
                <span className="flex-1">
                    <span className="block text-xs font-medium text-foreground">{title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span>
                </span>
            </button>
            {children}
        </div>
    );
}

interface ChipAppearance {
    container: string;
    dot: string;
    pulse: boolean;
    prefix: string | null;
    prefixTone: string;
    name: string;
    source: string | null;
}

function deriveChip(
    resolved: ResolvedStageModel,
    stageOverrideId: string | null,
    runOverrideId: string | null,
    aiModels: AIModelOption[],
): ChipAppearance {
    if (runOverrideId) {
        const runModel = aiModels.find((m) => m.id === runOverrideId);
        return {
            container:
                'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 reader:text-amber-200',
            dot: 'bg-amber-500',
            pulse: true,
            prefix: 'this run',
            prefixTone: 'text-amber-700 dark:text-amber-300 reader:text-amber-300',
            name: runModel?.name ?? resolved.name,
            source: null,
        };
    }

    if (stageOverrideId && resolved.source === 'stage_override') {
        return {
            container: 'border-primary/30 bg-primary/5',
            dot: 'bg-primary',
            pulse: false,
            prefix: null,
            prefixTone: '',
            name: resolved.name,
            source: SOURCE_LABEL[resolved.source],
        };
    }

    return {
        container: 'border-border bg-card',
        dot: 'bg-muted-foreground/60',
        pulse: false,
        prefix: null,
        prefixTone: '',
        name: resolved.name,
        source: SOURCE_LABEL[resolved.source],
    };
}

function ThinkingChip({ mode }: { mode: ThinkingMode }) {
    if (mode === 'none') return null;

    const styles =
        mode === 'max'
            ? 'border-[color:var(--badge-danger-bg)] bg-[color:var(--badge-danger-bg)] text-[color:var(--badge-danger-fg)]'
            : 'border-[color:var(--badge-reward-bg)] bg-[color:var(--badge-reward-bg)] text-[color:var(--badge-reward-fg)]';

    return (
        <span className={`inline-flex items-center rounded-sm border px-1 font-mono text-[9px] uppercase tracking-[0.14em] ${styles}`}>
            {mode === 'max' ? 'Think Max' : 'Think'}
        </span>
    );
}

function GroupedModelList({ aiModels }: { aiModels: AIModelOption[] }) {
    const groups = useMemo(() => {
        const map = new Map<string, AIModelOption[]>();
        for (const m of aiModels) {
            const key = m.provider_name;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(m);
        }
        return map;
    }, [aiModels]);

    return (
        <>
            {[...groups.entries()].map(([providerName, models]) => (
                <SelectGroup key={providerName}>
                    <SelectLabel className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70 px-2 pt-2 pb-0.5">
                        {providerName}
                    </SelectLabel>
                    {models.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                            <span className="flex items-center gap-2">
                                <span className="truncate">{m.name}</span>
                                <ThinkingChip mode={m.thinking_mode} />
                            </span>
                        </SelectItem>
                    ))}
                </SelectGroup>
            ))}
        </>
    );
}
