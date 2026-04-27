import { ChevronDown, Loader2, Zap } from 'lucide-react';
import { ModelPickerPopover, type Stage } from './model-picker-popover';
import { cn } from '@/lib/utils';
import type { AIModelOption, ContentProject, ResolvedStageModel } from '@/types/content-studio';

interface CompoundGenerateButtonProps {
    projectId: string;
    stage: Stage;
    resolvedModel: ResolvedStageModel;
    aiModels: AIModelOption[];
    currentStageOverrideId: string | null;
    runOverrideId: string | null;
    onProjectUpdate: (project: ContentProject) => void;
    onRunOverrideChange: (modelId: string | null) => void;

    label: string;
    busy?: boolean;
    busyLabel?: string;
    busyElapsed?: string;
    disabled?: boolean;
    onGenerate: () => void;
}

export function CompoundGenerateButton({
    projectId,
    stage,
    resolvedModel,
    aiModels,
    currentStageOverrideId,
    runOverrideId,
    onProjectUpdate,
    onRunOverrideChange,
    label,
    busy = false,
    busyLabel = 'Generating',
    busyElapsed,
    disabled = false,
    onGenerate,
}: CompoundGenerateButtonProps) {
    const isRunOverride = !!runOverrideId;
    const activeModel = isRunOverride ? aiModels.find((m) => m.id === runOverrideId) : null;
    const displayModel = activeModel?.name ?? resolvedModel.name;

    const containerClass = cn(
        'inline-flex h-9 items-stretch overflow-hidden rounded-md font-medium shadow-sm transition-transform',
        isRunOverride
            ? 'bg-[color:var(--honey)] text-background hover:translate-y-[-0.5px]'
            : 'bg-foreground text-background hover:translate-y-[-0.5px]',
        disabled && 'pointer-events-none opacity-60',
        busy && 'cursor-progress opacity-90',
    );

    if (busy) {
        return (
            <div className={containerClass}>
                <span className="inline-flex items-center gap-2 px-4 text-[13px]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {busyLabel}
                    {busyElapsed && <span className="ml-1 tech text-background/70">{busyElapsed}</span>}
                </span>
            </div>
        );
    }

    const trigger = (
        <button
            type="button"
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
            className={cn(
                'inline-flex items-center gap-1.5 px-3 text-[12px] transition-colors',
                isRunOverride
                    ? 'text-background/80 hover:bg-black/5'
                    : 'text-background/75 hover:bg-white/5',
            )}
        >
            <span
                className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isRunOverride ? 'bg-background' : 'bg-[color:var(--honey-line)]',
                )}
                style={isRunOverride ? { boxShadow: '0 0 0 2px rgb(255 255 255 / 0.3)' } : undefined}
            />
            {isRunOverride ? 'this run' : displayModel}
            <ChevronDown className="h-2.5 w-2.5" />
        </button>
    );

    return (
        <div className={containerClass}>
            <button
                type="button"
                disabled={disabled}
                onClick={onGenerate}
                className="inline-flex items-center gap-2 px-4 text-[13.5px]"
            >
                <Zap className="h-3 w-3" />
                {isRunOverride ? `${label} with ${displayModel}` : label}
            </button>

            <span className={cn('my-1.5 w-px', isRunOverride ? 'bg-black/10' : 'bg-white/10')} aria-hidden />

            <ModelPickerPopover
                projectId={projectId}
                stage={stage}
                resolvedModel={resolvedModel}
                aiModels={aiModels}
                currentStageOverrideId={currentStageOverrideId}
                runOverrideId={runOverrideId}
                onProjectUpdate={onProjectUpdate}
                onRunOverrideChange={onRunOverrideChange}
                trigger={trigger}
            />
        </div>
    );
}
