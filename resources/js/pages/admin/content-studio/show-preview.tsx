import { useCallback, useEffect, useState } from 'react';
import ContentStudioLayout from '@/layouts/content-studio-layout';
import { StageContentPreview } from '@/components/admin/content-studio/stage-content-preview';
import type { StageKey } from '@/components/admin/content-studio/stage-rail';
import type { InspectorTab } from '@/components/admin/content-studio/inspector-peek';
import type {
    AIModelOption,
    ContentProject,
    GenerationLogEntry,
    ResolvedStageModels,
    TopicWithBlocks,
} from '@/types/content-studio';

interface Props {
    project: ContentProject;
    generationLogs: GenerationLogEntry[];
    aiModels: AIModelOption[];
    platformDefaultModelId: string | null;
    resolvedModels: ResolvedStageModels;
    topicsWithBlocks: TopicWithBlocks[];
}

function getDefaultStep(project: ContentProject): StageKey {
    const anyTopicApproved = Object.keys(project.progress_data?.blocks_approved ?? {}).length > 0;
    const schemeApproved = !!project.progress_data?.scheme_approved_at;
    const schemeSkipped = !!project.progress_data?.scheme_skipped;
    const researchComplete = !!project.progress_data?.research_approved_at;

    if (anyTopicApproved) return 'content';
    if (schemeApproved || schemeSkipped) return 'blocks';
    if (researchComplete) return 'scheme';
    return 'research';
}

export default function ContentStudioShowPreview({
    project: initialProject,
    generationLogs: propLogs,
    aiModels,
    resolvedModels,
    topicsWithBlocks,
}: Props) {
    const [project, setProject] = useState(initialProject);
    const [logs, setLogs] = useState(propLogs);
    const [activeStep, setActiveStep] = useState<StageKey>(() => getDefaultStep(initialProject));
    const [inspectorTab, setInspectorTab] = useState<InspectorTab | null>(null);
    const [logDrawerOpen, setLogDrawerOpen] = useState(false);

    useEffect(() => {
        setLogs(propLogs);
    }, [propLogs]);

    const handleProjectUpdate = useCallback((updated: ContentProject) => setProject(updated), []);

    const handleInspectorTabClick = useCallback((tab: InspectorTab) => {
        setInspectorTab((prev) => (prev === tab ? null : tab));
    }, []);

    const isSecondary = project.mode === 'secondary';
    const pageTitle = isSecondary ? project.curriculum_subject_name : project.discipline_name;

    return (
        <ContentStudioLayout
            project={project}
            resolvedModels={resolvedModels}
            logCount={logs.length}
            selectedStep={activeStep}
            onStepClick={setActiveStep}
            onLogClick={() => setLogDrawerOpen((v) => !v)}
            inspectorTab={inspectorTab}
            onInspectorTabClick={handleInspectorTabClick}
            inspectorEnabled={activeStep === 'content'}
            pageTitle={pageTitle ?? undefined}
        >
            {activeStep === 'content' ? (
                <StageContentPreview
                    project={project}
                    topicsWithBlocks={topicsWithBlocks}
                    aiModels={aiModels}
                    resolvedModels={resolvedModels}
                    generationLogs={logs}
                    inspectorTab={inspectorTab}
                    onInspectorTabClick={handleInspectorTabClick}
                    onProjectUpdate={handleProjectUpdate}
                />
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
                    <p className="font-display text-[18px] font-semibold tracking-tight">
                        {activeStep} stage placeholder
                    </p>
                    <p className="max-w-[48ch] text-[13.5px] text-muted-foreground">
                        Phase 9 fills this in. The redesigned content stage is live above — switch the rail icon to
                        Content.
                    </p>
                </div>
            )}
            {logDrawerOpen && (
                <p className="fixed bottom-4 right-4 rounded bg-foreground/90 px-3 py-1 text-[11px] text-background">
                    Log drawer toggled (drawer ships in Phase 8)
                </p>
            )}
        </ContentStudioLayout>
    );
}
