import { useState, useCallback, useRef } from 'react';
import { Head } from '@inertiajs/react';
import ContentStudioController from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { GenerationLogPanel } from '@/components/admin/content-studio/generation-log-panel';
import { ProjectModelSummary } from '@/components/admin/content-studio/project-model-summary';
import { ProjectStepper } from '@/components/admin/content-studio/project-stepper';
import { StageBlocks } from '@/components/admin/content-studio/stage-blocks';
import { StageContent } from '@/components/admin/content-studio/stage-content';
import { StageResearch } from '@/components/admin/content-studio/stage-research';
import { StageScheme } from '@/components/admin/content-studio/stage-scheme';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import type { AIModelOption, ContentProject, ContentProjectStatus, GenerationLogEntry, ResolvedStageModels, TopicWithBlocks } from '@/types/content-studio';

const STEP_ORDER = ['research', 'scheme', 'blocks', 'content', 'questions'] as const;

function getDefaultStep(project: ContentProject): string {
    const anyTopicApproved = Object.keys(project.progress_data?.blocks_approved ?? {}).length > 0;
    const schemeApproved = !!project.progress_data?.scheme_approved_at;
    const schemeSkipped = !!project.progress_data?.scheme_skipped;
    const researchComplete = !!project.progress_data?.research_approved_at;

    if (anyTopicApproved) return 'content';
    if (schemeApproved || schemeSkipped) return 'blocks';
    if (researchComplete) return 'scheme';
    return 'research';
}

interface Props {
    project: ContentProject;
    generationLogs: GenerationLogEntry[];
    aiModels: AIModelOption[];
    platformDefaultModelId: string | null;
    resolvedModels: ResolvedStageModels;
    topicsWithBlocks: TopicWithBlocks[];
}

const STATUS_STYLES: Record<ContentProjectStatus, string> = {
    draft: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    research: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    structuring: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    generating: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    reviewing: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
    complete: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
};

interface StageWorkspaceProps {
    project: ContentProject;
    aiModels: AIModelOption[];
    resolvedModels: ResolvedStageModels;
    topicsWithBlocks: TopicWithBlocks[];
    activeStep: string;
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

function StageWorkspace({ project, aiModels, resolvedModels, topicsWithBlocks, activeStep, onProjectUpdate, onLogAppend }: StageWorkspaceProps) {
    const status = project.status;
    const schemeApproved = !!project.progress_data?.scheme_approved_at;
    const schemeSkipped = !!project.progress_data?.scheme_skipped;
    const anyTopicApproved = Object.keys(project.progress_data?.blocks_approved ?? {}).length > 0;

    if (activeStep === 'content' && anyTopicApproved) {
        return (
            <div className="overflow-hidden rounded-lg border border-border" style={{ height: 'calc(100vh - 22rem)' }}>
                <StageContent
                    project={project}
                    topicsWithBlocks={topicsWithBlocks}
                    aiModels={aiModels}
                    resolvedModels={resolvedModels}
                    onProjectUpdate={onProjectUpdate}
                />
            </div>
        );
    }

    if (activeStep === 'blocks' && (schemeApproved || schemeSkipped)) {
        return (
            <StageBlocks
                project={project}
                aiModels={aiModels}
                resolvedModel={resolvedModels.blocks}
                isActive={status === 'structuring'}
                onProjectUpdate={onProjectUpdate}
                onLogAppend={onLogAppend}
            />
        );
    }

    if (activeStep === 'scheme') {
        return (
            <StageScheme
                project={project}
                aiModels={aiModels}
                resolvedModel={resolvedModels.scheme}
                isActive={status === 'research' || (status === 'structuring' && !schemeApproved && !schemeSkipped)}
                onProjectUpdate={onProjectUpdate}
                onLogAppend={onLogAppend}
            />
        );
    }

    return (
        <StageResearch
            project={project}
            aiModels={aiModels}
            resolvedModel={resolvedModels.research}
            isActive={status === 'draft' || status === 'research'}
            onProjectUpdate={onProjectUpdate}
            onLogAppend={onLogAppend}
        />
    );
}

export default function ContentStudioShow({ project: initialProject, generationLogs: initialLogs, aiModels, platformDefaultModelId, resolvedModels, topicsWithBlocks }: Props) {
    const [project, setProject] = useState(initialProject);
    const [logs, setLogs] = useState(initialLogs);
    const [activeStep, setActiveStep] = useState(() => getDefaultStep(initialProject));
    const activeStepRef = useRef(activeStep);
    activeStepRef.current = activeStep;

    const handleProjectUpdate = useCallback((updated: ContentProject) => {
        setProject(updated);
        // Auto-advance to the next available step, never go back automatically.
        const next = getDefaultStep(updated);
        const currentIdx = STEP_ORDER.indexOf(activeStepRef.current as typeof STEP_ORDER[number]);
        const nextIdx = STEP_ORDER.indexOf(next as typeof STEP_ORDER[number]);
        if (nextIdx > currentIdx) setActiveStep(next);
    }, []);

    const handleLogAppend = useCallback((entry: GenerationLogEntry) => {
        setLogs((prev) => [entry, ...prev]);
    }, []);

    const isSecondary = project.mode === 'secondary';
    const title = isSecondary
        ? project.curriculum_subject_name
        : project.discipline_name;

    const breadcrumbs = [
        { title: 'Content Studio', href: ContentStudioController.index.url() },
        { title: title ?? 'Project', href: '#' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`${title ?? 'Project'} — Content Studio`} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            {title ?? 'Untitled Project'}
                        </h1>
                        <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">{project.mode_label}</Badge>
                            <Badge variant="secondary" className={STATUS_STYLES[project.status]}>
                                {project.status_label}
                            </Badge>
                            {isSecondary && project.education_level_name && (
                                <Badge variant="outline">{project.education_level_name}</Badge>
                            )}
                        </div>
                    </div>
                </div>

                <ProjectModelSummary
                    project={project}
                    aiModels={aiModels}
                    resolvedModels={resolvedModels}
                    platformDefaultModelId={platformDefaultModelId}
                    onProjectUpdate={handleProjectUpdate}
                />

                <ProjectStepper
                    status={project.status}
                    progressData={project.progress_data}
                    mode={project.mode}
                    selectedStep={activeStep}
                    onStepClick={setActiveStep}
                />

                <StageWorkspace
                    project={project}
                    aiModels={aiModels}
                    resolvedModels={resolvedModels}
                    topicsWithBlocks={topicsWithBlocks}
                    activeStep={activeStep}
                    onProjectUpdate={handleProjectUpdate}
                    onLogAppend={handleLogAppend}
                />

                <GenerationLogPanel logs={logs} />
            </div>
        </AdminLayout>
    );
}
