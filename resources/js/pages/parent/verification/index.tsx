import { Head, Link } from '@inertiajs/react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { index as dashboardIndex } from '@/actions/App/Http/Controllers/ParentDashboard/ParentDashboardController';
import { show as verificationShow } from '@/actions/App/Http/Controllers/ParentDashboard/VerificationController';
import ParentLayout from '@/layouts/parent-layout';
import type { VerificationQueueItem, VerificationStats } from '@/types/parent';

interface VerificationIndexProps {
    child: { id: string; user: { name: string } };
    queue: VerificationQueueItem[];
    stats: VerificationStats;
}

export default function VerificationIndex({ child, queue, stats }: VerificationIndexProps) {
    const childName = child.user.name.split(' ')[0];

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: dashboardIndex.url() },
            { title: 'Verification', href: '#' },
        ]}>
            <Head title={`Verification — ${childName}`} />

            <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">Verification Queue</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Topics ready for you to verify {childName}&apos;s understanding
                    </p>
                </div>

                {/* Stats summary */}
                {stats.total > 0 && (
                    <div className="flex flex-wrap gap-4 rounded-lg bg-muted px-4 py-3 text-sm">
                        <span className="text-foreground">
                            <strong>{stats.total}</strong> verified
                        </span>
                        <span className="text-[var(--canopy-600)]">
                            {stats.understood} understood
                        </span>
                        {stats.partially_understood > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                                {stats.partially_understood} partial
                            </span>
                        )}
                        {stats.needs_review > 0 && (
                            <span className="text-red-600 dark:text-red-400">
                                {stats.needs_review} need review
                            </span>
                        )}
                    </div>
                )}

                {/* Queue list */}
                {queue.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
                        <p className="mt-3 font-medium text-foreground">No topics to verify right now</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Topics will appear here when {childName} completes study sessions or the curriculum progresses.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {queue.map((item) => (
                            <Link
                                key={item.id}
                                href={verificationShow.url({ studentProfile: child.id, topic: item.id })}
                                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
                            >
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--canopy-50)] dark:bg-[var(--canopy-950)]">
                                    <ShieldCheck className="size-4 text-[var(--canopy-600)]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{item.education_level.replace('_', ' ')}</p>
                                </div>
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </ParentLayout>
    );
}
