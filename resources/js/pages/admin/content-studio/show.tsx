import { Head } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import ContentStudioController from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import type { ContentProject, ContentProjectStatus } from '@/types/content-studio';

interface Props {
    project: ContentProject;
}

const STATUS_STYLES: Record<ContentProjectStatus, string> = {
    draft: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    research: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300',
    structuring: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300',
    generating: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 reader:bg-purple-900/40 reader:text-purple-300',
    reviewing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 reader:bg-orange-900/40 reader:text-orange-300',
    complete: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
};

export default function ContentStudioShow({ project }: Props) {
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

                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 rounded-full bg-muted p-4">
                            <Sparkles className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-display text-lg font-semibold">
                            Stage workspace coming soon
                        </h3>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            The Content Studio stages (research, structure, content generation, questions, and more) will be built in Phase 2.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
