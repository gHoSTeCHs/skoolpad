import { useState, useCallback } from 'react';
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
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

function StageWorkspace({ project, aiModels, resolvedModels, topicsWithBlocks, onProjectUpdate, onLogAppend }: StageWorkspaceProps) {
    const status = project.status;
    const aiContext = project.ai_context;
    const researchApproved = !!aiContext?.research_approved;
    const schemeApproved = !!aiContext?.scheme_approved;
    const schemeSkipped = !!project.progress_data?.scheme_skipped;
    const anyTopicApproved = Object.keys(project.progress_data?.blocks_approved ?? {}).length > 0;

    return (
        <div className="space-y-4">
            <StageResearch
                project={project}
                aiModels={aiModels}
                resolvedModel={resolvedModels.research}
                isActive={status === 'draft' || status === 'research'}
                onProjectUpdate={onProjectUpdate}
                onLogAppend={onLogAppend}
            />

            {researchApproved && (
                <StageScheme
                    project={project}
                    aiModels={aiModels}
                    resolvedModel={resolvedModels.scheme}
                    isActive={status === 'research' || (status === 'structuring' && !schemeApproved && !schemeSkipped)}
                    onProjectUpdate={onProjectUpdate}
                    onLogAppend={onLogAppend}
                />
            )}

            {(schemeApproved || schemeSkipped) && (
                <StageBlocks
                    project={project}
                    aiModels={aiModels}
                    resolvedModel={resolvedModels.blocks}
                    isActive={status === 'structuring'}
                    onProjectUpdate={onProjectUpdate}
                    onLogAppend={onLogAppend}
                />
            )}

            {anyTopicApproved && (
                <StageContent
                    project={project}
                    topicsWithBlocks={topicsWithBlocks}
                    aiModels={aiModels}
                    resolvedModels={resolvedModels}
                    onProjectUpdate={onProjectUpdate}
                />
            )}
        </div>
    );
}

export default function ContentStudioShow({ project: initialProject, generationLogs: initialLogs, aiModels, platformDefaultModelId, resolvedModels, topicsWithBlocks }: Props) {
    const [project, setProject] = useState(initialProject);
    const [logs, setLogs] = useState(initialLogs);

    const handleProjectUpdate = useCallback((updated: ContentProject) => {
        setProject(updated);
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
                />

                <StageWorkspace
                    project={project}
                    aiModels={aiModels}
                    resolvedModels={resolvedModels}
                    topicsWithBlocks={topicsWithBlocks}
                    onProjectUpdate={handleProjectUpdate}
                    onLogAppend={handleLogAppend}
                />

                <GenerationLogPanel logs={logs} />
            </div>
        </AdminLayout>
    );
}
