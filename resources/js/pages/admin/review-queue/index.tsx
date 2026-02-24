import { Head, Link } from '@inertiajs/react';
import { Camera, ClipboardCheck, Eye } from 'lucide-react';
import ReviewQueueController from '@/actions/App/Http/Controllers/Admin/ReviewQueueController';
import { type ColumnDef, DataTable } from '@/components/admin/data-table';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFilterHandlers } from '@/hooks/use-filter-handlers';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import type { PaginatedData } from '@/types/models';
import type { EnumOption } from '@/types/questions';
import type { ReviewQueueFilters, SubmissionListItem } from '@/types/review-queue';

interface Props {
    submissions: PaginatedData<SubmissionListItem>;
    filters: ReviewQueueFilters;
    submission_types: EnumOption[];
    statuses: EnumOption[];
}

const breadcrumbs = [{ title: 'Review Queue', href: '/admin/review-queue' }];

const statusStyles: Record<string, string> = {
    pending: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)] hover:bg-[var(--badge-reward-bg)] border-[var(--badge-reward-fg)]/10',
    approved: 'bg-[var(--badge-primary-bg)] text-[var(--badge-primary-fg)] hover:bg-[var(--badge-primary-bg)] border-[var(--badge-primary-fg)]/10',
    rejected: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)] hover:bg-[var(--badge-danger-bg)] border-[var(--badge-danger-fg)]/10',
};

const typeStyles: Record<string, string> = {
    question: 'bg-canopy-100 text-canopy-900 dark:bg-canopy-900/20 dark:text-canopy-300 reader:bg-canopy-900/20 reader:text-canopy-300 border-canopy-200 dark:border-canopy-800/30 reader:border-canopy-800/30',
    correction: 'bg-ember-100 text-ember-900 dark:bg-ember-900/20 dark:text-ember-300 reader:bg-ember-900/20 reader:text-ember-300 border-ember-200 dark:border-ember-800/30 reader:border-ember-800/30',
    topic_content: 'bg-honey-100 text-honey-900 dark:bg-honey-900/20 dark:text-honey-300 reader:bg-honey-900/20 reader:text-honey-300 border-honey-200 dark:border-honey-800/30 reader:border-honey-800/30',
    past_question_upload: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300 reader:bg-emerald-900/20 reader:text-emerald-300 border-emerald-200 dark:border-emerald-800/30 reader:border-emerald-800/30',
};

const columns: ColumnDef<SubmissionListItem>[] = [
    {
        id: 'submission_type',
        header: 'Type',
        cell: (row) => (
            <Badge
                variant="secondary"
                className={`${typeStyles[row.submission_type] ?? ''} border font-medium tracking-tight transition-all duration-200 hover:scale-[1.02]`}
            >
                {row.submission_type_label}
            </Badge>
        ),
    },
    {
        id: 'submitted_by_name',
        header: 'Contributor',
        cell: (row) => (
            <span className="font-body text-sm font-medium tracking-tight text-foreground">
                {row.submitted_by_name}
            </span>
        ),
    },
    {
        id: 'course_code',
        header: 'Context',
        cell: (row) => (
            <div className="space-y-0.5">
                <span className="block font-body text-sm font-semibold tracking-tight">
                    {row.course_code ?? '—'}
                </span>
                {row.institution_abbreviation && (
                    <span className="block font-body text-xs font-medium tracking-wide text-muted-foreground/70">
                        {row.institution_abbreviation}
                    </span>
                )}
            </div>
        ),
    },
    {
        id: 'has_images',
        header: 'Media',
        cell: (row) => row.has_images ? (
            <div className="flex items-center justify-center">
                <Camera className="size-4 text-canopy-600 dark:text-canopy-400 reader:text-canopy-400" strokeWidth={2} />
            </div>
        ) : (
            <span className="text-muted-foreground/40">—</span>
        ),
        align: 'center',
    },
    {
        id: 'status',
        header: 'Status',
        cell: (row) => (
            <Badge
                variant="secondary"
                className={`${statusStyles[row.status] ?? ''} border font-medium tracking-tight transition-all duration-200 hover:scale-[1.02]`}
            >
                {row.status_label}
            </Badge>
        ),
    },
    {
        id: 'created_at',
        header: 'Submitted',
        cell: (row) => (
            <time className="font-body text-sm text-muted-foreground">
                {formatDate(row.created_at)}
            </time>
        ),
    },
];

export default function AdminReviewQueueIndex({ submissions, filters, submission_types, statuses }: Props) {
    const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
        indexUrl: ReviewQueueController.index.url(),
        filters,
    });

    const isContentTab = true;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Review Queue" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1.5">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Review Queue
                    </h1>
                    <p className="font-body text-sm text-muted-foreground">
                        Curate and approve community-contributed content
                    </p>
                </div>

                <nav className="relative border-b border-border" aria-label="Submission types">
                    <div className="flex gap-1">
                        <Link
                            href={ReviewQueueController.index.url()}
                            className={`
                                group relative px-5 py-3 font-body text-sm font-semibold tracking-tight transition-all duration-300
                                ${isContentTab
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            <span className="relative z-10">Content Submissions</span>
                            {isContentTab && (
                                <span
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-canopy-600 via-canopy-500 to-canopy-600 dark:from-canopy-400 dark:via-canopy-300 dark:to-canopy-400"
                                    style={{
                                        animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                />
                            )}
                        </Link>
                        <Link
                            href={ReviewQueueController.uploads.url()}
                            className={`
                                group relative px-5 py-3 font-body text-sm font-semibold tracking-tight transition-all duration-300
                                text-muted-foreground hover:text-foreground
                            `}
                        >
                            <span className="relative z-10">Photo Uploads</span>
                        </Link>
                    </div>
                </nav>

                <div className="rounded-lg border border-border bg-card shadow-sm">
                    <DataTable
                        columns={columns}
                        paginatedData={submissions}
                        getRowKey={(row) => row.id}
                        toolbar={
                            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <span className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Filter by
                                    </span>
                                </div>
                                <Select
                                    value={filters.submission_type ?? 'all'}
                                    onValueChange={(value) => handleFilterChange('submission_type', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger className="w-[200px] border-border/60 bg-background/50 font-body text-sm font-medium shadow-none transition-all duration-200 hover:border-border hover:bg-background">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="font-body text-sm">
                                            All Types
                                        </SelectItem>
                                        {submission_types.map((t) => (
                                            <SelectItem key={t.value} value={t.value} className="font-body text-sm">
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.status ?? 'all'}
                                    onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger className="w-[160px] border-border/60 bg-background/50 font-body text-sm font-medium shadow-none transition-all duration-200 hover:border-border hover:bg-background">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="font-body text-sm">
                                            All Statuses
                                        </SelectItem>
                                        {statuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value} className="font-body text-sm">
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="font-body text-xs font-semibold tracking-tight text-muted-foreground transition-all duration-200 hover:text-foreground"
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </div>
                        }
                        renderActions={(row) => (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 transition-all duration-200 hover:scale-110 hover:bg-canopy-100 hover:text-canopy-700 dark:hover:bg-canopy-900/30 dark:hover:text-canopy-400"
                                asChild
                            >
                                <Link href={ReviewQueueController.show.url(row.id)}>
                                    <Eye className="size-4" strokeWidth={2} />
                                    <span className="sr-only">Review submission</span>
                                </Link>
                            </Button>
                        )}
                        emptyState={{
                            icon: ClipboardCheck,
                            title: 'All caught up',
                            description: 'No submissions to review right now. Check back later for new contributions.',
                        }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: scaleX(0);
                        opacity: 0;
                    }
                    to {
                        transform: scaleX(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
