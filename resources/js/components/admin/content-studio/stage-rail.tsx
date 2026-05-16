import { FileSearch, ListOrdered, LayoutGrid, FileText, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentProjectMode, ContentProjectStatus, ProgressData } from '@/types/content-studio';

export type StageKey = 'research' | 'scheme' | 'blocks' | 'content' | 'questions';
type StageState = 'completed' | 'active' | 'pending' | 'skipped';

interface StageRailProps {
    status: ContentProjectStatus;
    progressData: ProgressData | null;
    mode: ContentProjectMode;
    selectedStep: StageKey;
    onStepClick: (key: StageKey) => void;
}

const STAGES = [
    { key: 'research' as const, label: 'Research', icon: FileSearch },
    { key: 'scheme' as const, label: 'Scheme of work', icon: ListOrdered },
    { key: 'blocks' as const, label: 'Block structure', icon: LayoutGrid },
    { key: 'content' as const, label: 'Content', icon: FileText },
    { key: 'questions' as const, label: 'Questions', icon: HelpCircle },
];

function getStageState(step: StageKey, status: ContentProjectStatus, progressData: ProgressData | null): StageState {
    const schemeSkipped = !!progressData?.scheme_skipped;
    const schemeApproved = !!progressData?.scheme_approved_at;
    const researchApproved = !!progressData?.research_approved_at;

    switch (step) {
        case 'research':
            return researchApproved ? 'completed' : 'active';
        case 'scheme':
            if (schemeSkipped) return 'skipped';
            if (schemeApproved) return 'completed';
            if (status === 'structuring' && !schemeApproved) return 'active';
            if (status === 'research' && researchApproved) return 'active';
            if (['generating', 'reviewing', 'complete'].includes(status)) return 'completed';
            return 'pending';
        case 'blocks':
            if (['generating', 'reviewing', 'complete'].includes(status)) return 'completed';
            if (status === 'structuring' && (schemeApproved || schemeSkipped)) return 'active';
            return 'pending';
        case 'content':
            if (['reviewing', 'complete'].includes(status)) return 'completed';
            if (status === 'generating') return 'active';
            return 'pending';
        case 'questions':
            if (status === 'complete') return 'completed';
            if (status === 'reviewing') return 'active';
            return 'pending';
    }
}

function isStageClickable(step: StageKey, progressData: ProgressData | null): boolean {
    const anyTopicApproved = Object.keys(progressData?.blocks_approved ?? {}).length > 0;
    const schemeApproved = !!progressData?.scheme_approved_at;
    const schemeSkipped = !!progressData?.scheme_skipped;
    const researchComplete = !!progressData?.research_approved_at;

    switch (step) {
        case 'research':
            return true;
        case 'scheme':
            return researchComplete;
        case 'blocks':
            return schemeApproved || schemeSkipped;
        case 'content':
            return anyTopicApproved;
        case 'questions':
            return false;
    }
}

function tooltipFor(step: StageKey, mode: ContentProjectMode, state: StageState): string {
    const base = STAGES.find((s) => s.key === step)!.label;
    if (step === 'scheme' && mode === 'tertiary') return `${base} · optional`;
    if (state === 'skipped') return `${base} · skipped`;
    if (state === 'completed') return `${base} · complete`;
    if (state === 'active') return `${base} · in progress`;
    return `${base} · locked`;
}

export function StageRail({ status, progressData, mode, selectedStep, onStepClick }: StageRailProps) {
    return (
        <aside className="flex h-full w-14 flex-col border-r border-border bg-card">
            <div className="flex h-14 items-center justify-center border-b border-border">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground font-display text-[12px] font-bold tracking-tight text-background">
                    cs
                </div>
            </div>
            <nav className="flex flex-1 flex-col gap-2 py-3">
                {STAGES.map((stage) => {
                    const state = getStageState(stage.key, status, progressData);
                    const clickable = isStageClickable(stage.key, progressData);
                    const selected = stage.key === selectedStep;
                    const Icon = stage.icon;
                    const tooltip = tooltipFor(stage.key, mode, state);

                    return (
                        <button
                            key={stage.key}
                            type="button"
                            disabled={!clickable}
                            onClick={() => clickable && onStepClick(stage.key)}
                            aria-current={selected ? 'step' : undefined}
                            aria-label={tooltip}
                            className={cn(
                                'group relative mx-auto flex h-10 w-10 items-center justify-center rounded-[10px] transition-all',
                                clickable ? 'cursor-pointer hover:bg-muted' : 'cursor-not-allowed opacity-50',
                                selected
                                    ? 'bg-foreground text-background shadow-md'
                                    : state === 'completed'
                                      ? 'text-primary hover:bg-primary/10'
                                      : 'text-muted-foreground/70',
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-[12px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                                {tooltip}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
