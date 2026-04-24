import { Check, Circle, Minus } from 'lucide-react';
import type { ContentProjectMode, ContentProjectStatus, ProgressData } from '@/types/content-studio';

interface ProjectStepperProps {
    status: ContentProjectStatus;
    progressData: ProgressData | null;
    mode: ContentProjectMode;
    selectedStep: string;
    onStepClick: (key: string) => void;
}

interface StepConfig {
    key: string;
    label: string;
    sublabel?: string;
}

type StepState = 'completed' | 'active' | 'pending' | 'skipped';

function getSteps(mode: ContentProjectMode): StepConfig[] {
    const steps: StepConfig[] = [
        { key: 'research', label: 'Research' },
        { key: 'scheme', label: 'Scheme of Work', sublabel: mode === 'tertiary' ? 'Optional' : undefined },
        { key: 'blocks', label: 'Block Structure' },
        { key: 'content', label: 'Content' },
        { key: 'questions', label: 'Questions' },
    ];

    return steps;
}

function isStepClickable(stepKey: string, progressData: ProgressData | null): boolean {
    const anyTopicApproved = Object.keys(progressData?.blocks_approved ?? {}).length > 0;
    const schemeApproved = !!progressData?.scheme_approved_at;
    const schemeSkipped = !!progressData?.scheme_skipped;
    const researchComplete = !!progressData?.research_approved_at;

    switch (stepKey) {
        case 'research': return true;
        case 'scheme': return researchComplete;
        case 'blocks': return schemeApproved || schemeSkipped;
        case 'content': return anyTopicApproved;
        default: return false;
    }
}

function getStepState(
    stepKey: string,
    status: ContentProjectStatus,
    progressData: ProgressData | null,
): StepState {
    const schemeSkipped = progressData?.scheme_skipped;
    const schemeApproved = !!progressData?.scheme_approved_at;
    const researchApproved = !!progressData?.research_approved_at;

    switch (stepKey) {
        case 'research':
            if (status === 'draft') return 'active';
            if (status === 'research' && !researchApproved) return 'active';
            if (researchApproved) return 'completed';
            return 'active';

        case 'scheme':
            if (schemeSkipped) return 'skipped';
            if (schemeApproved) return 'completed';
            if (status === 'structuring' && !schemeApproved && !schemeSkipped) return 'active';
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

        default:
            return 'pending';
    }
}

function StepIcon({ state }: { state: StepState }) {
    if (state === 'completed') {
        return (
            <div className="flex size-7 items-center justify-center rounded-full bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] dark:bg-emerald-900/40 dark:text-emerald-400 reader:bg-emerald-900/40 reader:text-emerald-400">
                <Check className="size-3.5" strokeWidth={2.5} />
            </div>
        );
    }

    if (state === 'active') {
        return (
            <div className="flex size-7 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                <div className="size-2.5 animate-pulse rounded-full bg-primary" />
            </div>
        );
    }

    if (state === 'skipped') {
        return (
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Minus className="size-3.5" />
            </div>
        );
    }

    return (
        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Circle className="size-3" />
        </div>
    );
}

export function ProjectStepper({ status, progressData, mode, selectedStep, onStepClick }: ProjectStepperProps) {
    const steps = getSteps(mode);

    return (
        <div className="w-full overflow-x-auto">
            <div className="flex min-w-max items-center gap-0">
                {steps.map((step, index) => {
                    const state = getStepState(step.key, status, progressData);
                    const clickable = isStepClickable(step.key, progressData);
                    const isSelected = step.key === selectedStep;
                    const isLast = index === steps.length - 1;

                    const inner = (
                        <div className={`flex items-center gap-2.5 transition-opacity ${!clickable ? 'opacity-35' : ''}`}>
                            <StepIcon state={state} />
                            <div className="flex flex-col">
                                <span className={`text-sm font-medium transition-colors ${
                                    isSelected
                                        ? 'text-foreground'
                                        : state === 'active'
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                }`}>
                                    {step.label}
                                </span>
                                {step.sublabel && (
                                    <span className="text-xs text-muted-foreground/70">{step.sublabel}</span>
                                )}
                            </div>
                        </div>
                    );

                    return (
                        <div key={step.key} className="flex items-center">
                            {clickable ? (
                                <button
                                    type="button"
                                    onClick={() => onStepClick(step.key)}
                                    className={`relative flex flex-col gap-0 rounded px-1 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                        isSelected ? '' : 'hover:opacity-80'
                                    }`}
                                    aria-current={isSelected ? 'step' : undefined}
                                >
                                    {inner}
                                    {isSelected && (
                                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary" />
                                    )}
                                </button>
                            ) : (
                                <div className="px-1 py-1">{inner}</div>
                            )}
                            {!isLast && (
                                <div className={`mx-4 h-px w-10 ${state === 'completed' ? 'bg-primary/40' : 'bg-border'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
