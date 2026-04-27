import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { StageRail, type StageKey } from '@/components/admin/content-studio/stage-rail';
import { StudioTopBar } from '@/components/admin/content-studio/studio-top-bar';
import { InspectorPeek, type InspectorTab } from '@/components/admin/content-studio/inspector-peek';
import type { ContentProject, ResolvedStageModel, ResolvedStageModels } from '@/types/content-studio';

interface ContentStudioLayoutProps {
    project: ContentProject;
    resolvedModels: ResolvedStageModels;
    logCount: number;
    selectedStep: StageKey;
    onStepClick: (key: StageKey) => void;
    onLogClick: () => void;
    inspectorTab: InspectorTab | null;
    onInspectorTabClick: (tab: InspectorTab) => void;
    inspectorEnabled?: boolean;
    inspectorHasAdvisory?: boolean;
    pageTitle?: string;
    children: ReactNode;
}

export default function ContentStudioLayout({
    project,
    resolvedModels,
    logCount,
    selectedStep,
    onStepClick,
    onLogClick,
    inspectorTab,
    onInspectorTabClick,
    inspectorEnabled = false,
    inspectorHasAdvisory = false,
    pageTitle,
    children,
}: ContentStudioLayoutProps) {
    const resolvedDefault: ResolvedStageModel = resolvedModels.content;

    return (
        <div className="grid h-screen grid-cols-[56px_1fr_44px] overflow-hidden bg-background text-foreground">
            <Head title={pageTitle ? `${pageTitle} — Content Studio` : 'Content Studio'} />
            <StageRail
                status={project.status}
                progressData={project.progress_data}
                mode={project.mode}
                selectedStep={selectedStep}
                onStepClick={onStepClick}
            />
            <main className="flex min-w-0 flex-col">
                <StudioTopBar
                    project={project}
                    resolvedDefaultModel={resolvedDefault}
                    logCount={logCount}
                    onLogClick={onLogClick}
                />
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
            </main>
            <InspectorPeek
                activeTab={inspectorTab}
                onTabClick={onInspectorTabClick}
                hasAdvisory={inspectorHasAdvisory}
                enabled={inspectorEnabled}
            />
        </div>
    );
}
