import { useCallback, useEffect, useMemo, useState } from 'react';
import ContentStudioLayout from '@/layouts/content-studio-layout';
import { StageContentPreview } from '@/components/admin/content-studio/stage-content-preview';
import { StageResearchPreview } from '@/components/admin/content-studio/stage-research-preview';
import { LogDrawer } from '@/components/admin/content-studio/log-drawer';
import type { StageKey } from '@/components/admin/content-studio/stage-rail';
import type { InspectorTab } from '@/components/admin/content-studio/inspector-peek';
import type {
    AIModelOption,
    ContentBlock,
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
    const anyTopicApproved =
        Object.keys(project.progress_data?.blocks_approved ?? {}).length > 0;
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
    platformDefaultModelId,
    resolvedModels,
    topicsWithBlocks,
}: Props) {
    const [project, setProject] = useState(initialProject);
    const [logs, setLogs] = useState(propLogs);
    const [activeStep, setActiveStep] = useState<StageKey>(() =>
        getDefaultStep(initialProject),
    );
    const [inspectorTab, setInspectorTab] = useState<InspectorTab | null>(null);
    const [logDrawerOpen, setLogDrawerOpen] = useState(false);
    const [activeBlock, setActiveBlock] = useState<ContentBlock | null>(null);

    useEffect(() => {
        setLogs(propLogs);
    }, [propLogs]);

    useEffect(() => {
        setProject(initialProject);
    }, [initialProject]);

    const handleProjectUpdate = useCallback(
        (updated: ContentProject) => setProject(updated),
        [],
    );

    const handleLogAppend = useCallback(
        (entry: GenerationLogEntry) => setLogs((prev) => [entry, ...prev]),
        [],
    );

    const handleInspectorTabClick = useCallback((tab: InspectorTab) => {
        setInspectorTab((prev) => (prev === tab ? null : tab));
    }, []);

    const handleActiveBlockChange = useCallback(
        (block: ContentBlock | null) => {
            setActiveBlock(block);
        },
        [],
    );

    const isSecondary = project.mode === 'secondary';
    const pageTitle = isSecondary
        ? project.curriculum_subject_name
        : project.discipline_name;

    const blockTitleResolver = useMemo(() => {
        const map = new Map<string, string>();
        for (const topic of topicsWithBlocks) {
            for (const block of topic.blocks) {
                map.set(block.id, `Block ${block.path} · ${block.title}`);
            }
        }
        return (id: string) => map.get(id) ?? null;
    }, [topicsWithBlocks]);

    const topicTitleResolver = useMemo(() => {
        const map = new Map<string, string>(
            topicsWithBlocks.map((t) => [t.id, t.title]),
        );
        return (id: string) => map.get(id) ?? null;
    }, [topicsWithBlocks]);

    return (
        <ContentStudioLayout
            project={project}
            aiModels={aiModels}
            platformDefaultModelId={platformDefaultModelId}
            resolvedModels={resolvedModels}
            logCount={logs.length}
            selectedStep={activeStep}
            onStepClick={setActiveStep}
            onLogClick={() => setLogDrawerOpen((v) => !v)}
            onProjectUpdate={handleProjectUpdate}
            inspectorTab={inspectorTab}
            onInspectorTabClick={handleInspectorTabClick}
            inspectorEnabled={activeStep === 'content'}
            inspectorHasAdvisory={!!activeBlock?.drift_advisory}
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
                    onActiveBlockChange={handleActiveBlockChange}
                    onProjectUpdate={handleProjectUpdate}
                />
            ) : activeStep === 'research' ? (
                <StageResearchPreview
                    project={project}
                    aiModels={aiModels}
                    resolvedModel={resolvedModels.research}
                    isActive={
                        project.status === 'draft' ||
                        project.status === 'research'
                    }
                    onProjectUpdate={handleProjectUpdate}
                    onLogAppend={handleLogAppend}
                />
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
                    <p className="font-display text-[18px] font-semibold tracking-tight">
                        {activeStep} stage placeholder
                    </p>
                    <p className="max-w-[48ch] text-[13.5px] text-muted-foreground">
                        Phase 9 fills this in. Switch the rail icon to Content
                        or Research to see redesigned stages.
                    </p>
                </div>
            )}
            <LogDrawer
                open={logDrawerOpen}
                onOpenChange={setLogDrawerOpen}
                logs={logs}
                blockTitleResolver={blockTitleResolver}
                topicTitleResolver={topicTitleResolver}
            />
        </ContentStudioLayout>
    );
}
