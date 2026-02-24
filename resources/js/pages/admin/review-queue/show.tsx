import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import ReviewQueueController from '@/actions/App/Http/Controllers/Admin/ReviewQueueController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { formatDate } from '@/lib/utils';
import type { SubmissionDetail } from '@/types/review-queue';

interface Props {
    submission: SubmissionDetail;
}

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

export default function AdminReviewQueueShow({ submission }: Props) {
    const [rejectOpen, setRejectOpen] = useState(false);
    const [approving, setApproving] = useState(false);

    const rejectForm = useForm({
        reviewer_notes: '',
    });

    const breadcrumbs = [
        { title: 'Review Queue', href: ReviewQueueController.index.url() },
        { title: 'Review Submission', href: '#' },
    ];

    function handleApprove() {
        setApproving(true);
        router.post(ReviewQueueController.approve.url(submission.id), {}, {
            preserveScroll: true,
            onFinish: () => setApproving(false),
        });
    }

    function handleReject(e: React.FormEvent) {
        e.preventDefault();
        rejectForm.post(ReviewQueueController.reject.url(submission.id), {
            preserveScroll: true,
            onSuccess: () => setRejectOpen(false),
        });
    }

    const isPending = submission.status === 'pending';

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Review Submission" />
            <div className="flex flex-col gap-8 p-4 md:p-6">
                <header className="flex items-start justify-between gap-6" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mt-1 transition-all duration-200 hover:scale-110 hover:bg-canopy-100 hover:text-canopy-700 dark:hover:bg-canopy-900/30 dark:hover:text-canopy-400"
                            asChild
                        >
                            <Link href={ReviewQueueController.index.url()}>
                                <ArrowLeft className="size-4" strokeWidth={2} />
                            </Link>
                        </Button>
                        <div className="space-y-2">
                            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                                Review Submission
                            </h1>
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="secondary"
                                    className={`${typeStyles[submission.submission_type] ?? ''} border font-medium tracking-tight`}
                                >
                                    {submission.submission_type_label}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className={`${statusStyles[submission.status] ?? ''} border font-medium tracking-tight`}
                                >
                                    {submission.status_label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    {isPending && (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-2 border-destructive/20 font-body font-semibold tracking-tight text-destructive transition-all duration-200 hover:border-destructive/40 hover:bg-destructive/5"
                                onClick={() => setRejectOpen(true)}
                            >
                                <XCircle className="size-4" strokeWidth={2.5} />
                                Reject
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleApprove}
                                disabled={approving}
                                className="border-2 border-canopy-600/20 bg-canopy-600 font-body font-semibold tracking-tight text-white shadow-sm transition-all duration-200 hover:border-canopy-700/40 hover:bg-canopy-700 hover:shadow-md dark:border-canopy-500/20 dark:bg-canopy-500"
                            >
                                <CheckCircle2 className="size-4" strokeWidth={2.5} />
                                Approve
                            </Button>
                        </div>
                    )}
                </header>

                <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                    <div className="flex flex-col gap-6" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards' }}>
                        <Card className="border-border/60 shadow-sm transition-all duration-300 hover:shadow-md">
                            <CardHeader className="border-b border-border/40 bg-muted/20">
                                <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                    Submission Content
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {submission.content ? (
                                    <div className="rounded-lg border border-border/40 bg-muted/30 p-6">
                                        <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90">
                                            {typeof submission.content === 'string'
                                                ? submission.content
                                                : JSON.stringify(submission.content, null, 2)}
                                        </pre>
                                    </div>
                                ) : (
                                    <p className="py-8 text-center font-body text-sm italic text-muted-foreground">
                                        No content provided
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {submission.images && submission.images.length > 0 && (
                            <Card className="border-border/60 shadow-sm transition-all duration-300 hover:shadow-md">
                                <CardHeader className="border-b border-border/40 bg-muted/20">
                                    <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                        Attached Media
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                        {submission.images.map((image, idx) => (
                                            <a
                                                key={idx}
                                                href={image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative overflow-hidden rounded-lg border-2 border-border/40 transition-all duration-300 hover:border-canopy-500/40 hover:shadow-lg"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`Upload ${idx + 1}`}
                                                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                            </a>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {submission.related_question && (
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="border-b border-border/40 bg-muted/20">
                                    <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                        Related Question
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="font-body text-sm leading-relaxed">
                                        {submission.related_question.content}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {submission.related_topic && (
                            <Card className="border-border/60 shadow-sm">
                                <CardHeader className="border-b border-border/40 bg-muted/20">
                                    <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                        Related Topic
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="font-body text-sm font-medium leading-relaxed">
                                        {submission.related_topic.title}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <aside className="flex flex-col gap-6" style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards' }}>
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader className="border-b border-border/40 bg-muted/20">
                                <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                    Submission Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <dl className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Submitted By
                                        </dt>
                                        <dd className="font-body text-sm font-medium text-foreground">
                                            {submission.submitted_by?.name ?? '—'}
                                            {submission.submitted_by?.email && (
                                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                                    {submission.submitted_by.email}
                                                </span>
                                            )}
                                        </dd>
                                    </div>

                                    {submission.institution_course && (
                                        <div className="flex flex-col gap-1.5 border-t border-border/30 pt-4">
                                            <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Course
                                            </dt>
                                            <dd className="font-body text-sm font-semibold text-foreground">
                                                {submission.institution_course.course_code}
                                                <span className="ml-1.5 font-normal text-muted-foreground">
                                                    ({submission.institution_course.institution.abbreviation})
                                                </span>
                                            </dd>
                                        </div>
                                    )}

                                    {submission.exam_year && (
                                        <div className="flex flex-col gap-1.5 border-t border-border/30 pt-4">
                                            <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Exam Year
                                            </dt>
                                            <dd className="font-body text-sm font-medium text-foreground">
                                                {submission.exam_year}
                                            </dd>
                                        </div>
                                    )}

                                    {submission.exam_semester && (
                                        <div className="flex flex-col gap-1.5 border-t border-border/30 pt-4">
                                            <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Semester
                                            </dt>
                                            <dd className="font-body text-sm font-medium capitalize text-foreground">
                                                {submission.exam_semester}
                                            </dd>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5 border-t border-border/30 pt-4">
                                        <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Submitted
                                        </dt>
                                        <dd className="font-body text-sm font-medium text-foreground">
                                            {formatDate(submission.created_at)}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        {submission.status !== 'pending' && (
                            <Card className="border-2 border-border/60 shadow-md">
                                <CardHeader className="border-b border-border/40 bg-gradient-to-br from-muted/40 to-muted/20">
                                    <CardTitle className="font-display text-lg font-semibold tracking-tight">
                                        Review Outcome
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <dl className="space-y-4">
                                        {submission.reviewer && (
                                            <div className="flex flex-col gap-1.5">
                                                <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Reviewed By
                                                </dt>
                                                <dd className="font-body text-sm font-semibold text-foreground">
                                                    {submission.reviewer.name}
                                                </dd>
                                            </div>
                                        )}
                                        {submission.reviewed_at && (
                                            <div className="flex flex-col gap-1.5 border-t border-border/30 pt-4">
                                                <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Reviewed At
                                                </dt>
                                                <dd className="font-body text-sm font-medium text-foreground">
                                                    {formatDate(submission.reviewed_at)}
                                                </dd>
                                            </div>
                                        )}
                                        {submission.reviewer_notes && (
                                            <div className="flex flex-col gap-2 border-t border-border/30 pt-4">
                                                <dt className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Review Notes
                                                </dt>
                                                <dd className="rounded-lg border border-border/40 bg-muted/30 p-4 font-body text-sm leading-relaxed text-foreground/90">
                                                    {submission.reviewer_notes}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </CardContent>
                            </Card>
                        )}
                    </aside>
                </div>

                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                    <DialogContent className="border-2 border-destructive/20 shadow-xl">
                        <form onSubmit={handleReject}>
                            <DialogHeader>
                                <DialogTitle className="font-display text-xl font-bold tracking-tight">
                                    Reject Submission
                                </DialogTitle>
                                <DialogDescription className="font-body text-sm leading-relaxed text-muted-foreground">
                                    Provide constructive feedback explaining why this submission cannot be approved. The contributor will receive this message.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-6">
                                <Textarea
                                    value={rejectForm.data.reviewer_notes}
                                    onChange={(e) => rejectForm.setData('reviewer_notes', e.target.value)}
                                    placeholder="Explain what needs to be improved..."
                                    rows={5}
                                    required
                                    maxLength={1000}
                                    className="border-border/60 font-body text-sm leading-relaxed focus:border-destructive/40 focus:ring-destructive/20"
                                />
                                {rejectForm.errors.reviewer_notes && (
                                    <p className="mt-2 font-body text-xs font-medium text-destructive">
                                        {rejectForm.errors.reviewer_notes}
                                    </p>
                                )}
                                <p className="mt-2 font-body text-xs text-muted-foreground">
                                    {rejectForm.data.reviewer_notes.length} / 1000 characters
                                </p>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" className="font-body font-medium">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={rejectForm.processing}
                                    className="font-body font-semibold"
                                >
                                    {rejectForm.processing ? 'Rejecting...' : 'Reject Submission'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
