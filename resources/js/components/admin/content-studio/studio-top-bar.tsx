import { Link } from '@inertiajs/react';
import { ChevronLeft, History } from 'lucide-react';
import * as ContentStudioAction from '@/actions/App/Http/Controllers/Admin/ContentStudioController';
import { cn } from '@/lib/utils';
import type { ContentProject, ContentProjectStatus, ResolvedStageModel } from '@/types/content-studio';

interface StudioTopBarProps {
    project: ContentProject;
    resolvedDefaultModel: ResolvedStageModel;
    logCount: number;
    onLogClick: () => void;
}

const STATUS_CLASS: Record<ContentProjectStatus, string> = {
    draft: 'bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-fg)]',
    research: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    structuring: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    generating: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)]',
    reviewing: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
    complete: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
};

export function StudioTopBar({ project, resolvedDefaultModel, logCount, onLogClick }: StudioTopBarProps) {
    const breadcrumb = project.mode === 'secondary' ? project.curriculum_subject_name : project.discipline_name;
    const title = breadcrumb ?? 'Untitled project';

    return (
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
            <Link
                href={ContentStudioAction.index.url()}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
            >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                Admin
            </Link>
            <span className="h-4 w-px bg-border" aria-hidden />
            <div className="flex min-w-0 items-center gap-2.5">
                {breadcrumb && (
                    <>
                        <span className="truncate text-[13px] text-muted-foreground/80">{breadcrumb}</span>
                        <span className="text-muted-foreground/60">/</span>
                    </>
                )}
                <h1 className="truncate font-display text-[16px] font-semibold tracking-tight">{title}</h1>
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium',
                        STATUS_CLASS[project.status],
                    )}
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {project.status_label}
                </span>
            </div>
            <div className="flex-1" />
            <button
                type="button"
                className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-[12.5px] font-medium transition-colors hover:border-border/70"
                title={`Default model · resolved via ${resolvedDefaultModel.source}`}
            >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{resolvedDefaultModel.name}</span>
            </button>
            <button
                type="button"
                onClick={onLogClick}
                className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <History className="h-3.5 w-3.5" aria-hidden />
                <span>Log</span>
                {logCount > 0 && <span className="tech text-[10.5px]">{logCount}</span>}
            </button>
        </header>
    );
}
