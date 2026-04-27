import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
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

export default function ContentStudioShowPreview({ project, topicsWithBlocks, generationLogs, aiModels }: Props) {
    return (
        <AdminLayout
            breadcrumbs={[
                { title: 'Content Studio', href: '/admin/content-studio' },
                { title: project.discipline_name ?? project.curriculum_subject_name ?? 'Project', href: '#' },
                { title: 'Redesign preview', href: '#' },
            ]}
        >
            <Head title="Redesign preview — Content Studio" />
            <div className="p-8">
                <div className="rounded-md border-2 border-dashed border-border bg-muted/30 p-6">
                    <h1 className="font-display text-xl font-bold">Redesign preview scaffold</h1>
                    <p className="mt-2 text-muted-foreground">
                        Parallel preview of the show page. Production show is untouched.
                    </p>
                    <ul className="mt-4 space-y-1 text-sm">
                        <li>
                            Project: <span className="tech">{project.id}</span>
                        </li>
                        <li>
                            Status: <span className="tech">{project.status}</span>
                        </li>
                        <li>
                            Topics with approved blocks: <span className="tech">{topicsWithBlocks.length}</span>
                        </li>
                        <li>
                            Generation logs (limit 100): <span className="tech">{generationLogs.length}</span>
                        </li>
                        <li>
                            Active AI models: <span className="tech">{aiModels.length}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}
