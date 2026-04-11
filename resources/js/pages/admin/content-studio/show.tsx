import { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import ContentStudioController from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { GenerationLogPanel } from '@/components/admin/content-studio/generation-log-panel';
import { ProjectStepper } from '@/components/admin/content-studio/project-stepper';
import { StageBlocks } from '@/components/admin/content-studio/stage-blocks';
import { StageResearch } from '@/components/admin/content-studio/stage-research';
import { StageScheme } from '@/components/admin/content-studio/stage-scheme';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import type { AIModelOption, ContentProject, ContentProjectStatus, GenerationLogEntry } from '@/types/content-studio';

interface Props {
    project: ContentProject;
    generationLogs: GenerationLogEntry[];
    aiModels: AIModelOption[];
}

const STATUS_STYLES: Record<ContentProjectStatus, string> = {
    draft: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    research: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300',
    structuring: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    generating: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 reader:bg-purple-900/40 reader:text-purple-300',
    reviewing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 reader:bg-orange-900/40 reader:text-orange-300',
    complete: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
};

interface StageWorkspaceProps {
    project: ContentProject;
    aiModels: AIModelOption[];
    onProjectUpdate: (project: ContentProject) => void;
    onLogAppend: (entry: GenerationLogEntry) => void;
}

function StageWorkspace({ project, aiModels, onProjectUpdate, onLogAppend }: StageWorkspaceProps) {
    const status = project.status;
    const aiContext = project.ai_context;
    const researchApproved = !!aiContext?.research_approved;
    const schemeApproved = !!aiContext?.scheme_approved;
    const schemeSkipped = !!project.progress_data?.scheme_skipped;

    return (
        <div className="space-y-4">
            <StageResearch
                project={project}
                aiModels={aiModels}
                isActive={status === 'draft' || status === 'research'}
                onProjectUpdate={onProjectUpdate}
                onLogAppend={onLogAppend}
            />

            {researchApproved && (
                <StageScheme
                    project={project}
                    aiModels={aiModels}
                    isActive={status === 'research' || (status === 'structuring' && !schemeApproved && !schemeSkipped)}
                    onProjectUpdate={onProjectUpdate}
                    onLogAppend={onLogAppend}
                />
            )}

            {(schemeApproved || schemeSkipped) && (
                <StageBlocks
                    project={project}
                    aiModels={aiModels}
                    isActive={status === 'structuring'}
                    onProjectUpdate={onProjectUpdate}
                    onLogAppend={onLogAppend}
                />
            )}
        </div>
    );
}

export default function ContentStudioShow({ project: initialProject, generationLogs: initialLogs, aiModels }: Props) {
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

                <ProjectStepper
                    status={project.status}
                    progressData={project.progress_data}
                    mode={project.mode}
                />

                <StageWorkspace
                    project={project}
                    aiModels={aiModels}
                    onProjectUpdate={handleProjectUpdate}
                    onLogAppend={handleLogAppend}
                />

                <GenerationLogPanel logs={logs} />
            </div>
        </AdminLayout>
    );
}
