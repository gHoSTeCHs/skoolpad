import { Head, Link } from '@inertiajs/react';
import { BookOpen, CheckCircle2, ChevronDown, Clock } from 'lucide-react';
import { useState } from 'react';
import { show as topicShow } from '@/actions/App/Http/Controllers/Student/TopicController';
import EmptyState from '@/components/skoolpad/empty-state';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { SubjectItem, SubjectProgress, SubjectShowData, SubjectTerm } from '@/types/student-subjects';

interface Props {
    subject: SubjectShowData;
    terms: SubjectTerm[];
    progress: SubjectProgress;
}

export default function SubjectShow({ subject, terms, progress }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: subject.name, href: '#' },
    ];

    const progressPercent = progress.total > 0
        ? Math.round((progress.completed / progress.total) * 100)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={subject.name} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-display text-2xl font-bold tracking-tight">
                            {subject.name}
                        </h1>
                        {subject.is_compulsory && (
                            <Badge variant="secondary" className="text-[10px]">Compulsory</Badge>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {[subject.education_level, subject.stream].filter(Boolean).join(' · ')}
                    </p>
                </div>

                {progress.total > 0 && (
                    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4" style={{ borderRadius: 'var(--card-radius)' }}>
                        <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                                <span className="text-[13px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                                    {progress.completed} of {progress.total} items completed
                                </span>
                                <span className="text-[12px] text-muted-foreground">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="mt-2 h-2" />
                        </div>
                    </div>
                )}

                {terms.length === 0 ? (
                    <EmptyState
                        icon={'\uD83D\uDCDA'}
                        title="No scheme of work"
                        description="This subject doesn't have a scheme of work mapped yet."
                    />
                ) : (
                    <div className="space-y-4">
                        {terms.map((term) => (
                            <TermSection key={term.term} term={term} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function TermSection({ term }: { term: SubjectTerm }) {
    const [open, setOpen] = useState(true);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/30" style={{ borderRadius: 'var(--card-radius)' }}>
                <span className="font-display text-[15px] font-semibold tracking-tight">
                    Term {term.term}
                </span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="mt-2 space-y-3 pl-2">
                    {term.weeks.map((week) => (
                        <div key={week.week}>
                            <h3 className="mb-1.5 text-[12px] font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Week {week.week}
                            </h3>
                            <div className="space-y-1.5">
                                {week.items.map((item) => (
                                    <SchemeItem key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

function SchemeItem({ item }: { item: SubjectItem }) {
    const title = item.topic_title ?? item.block_title ?? item.topic_label;
    const isClickable = !!item.canonical_topic_id;

    const content = (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/30" style={{ borderRadius: 'var(--card-radius)' }}>
            {item.is_completed ? (
                <CheckCircle2 className="size-4 shrink-0 text-green-500" />
            ) : (
                <BookOpen className="size-4 shrink-0 text-muted-foreground/50" />
            )}
            <div className="flex-1 min-w-0">
                <span className="truncate text-[13px] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                    {title}
                </span>
            </div>
            {item.estimated_read_time && (
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {item.estimated_read_time} min
                </span>
            )}
        </div>
    );

    if (isClickable) {
        return (
            <Link href={topicShow.url(item.canonical_topic_id!)} prefetch>
                {content}
            </Link>
        );
    }

    return content;
}
