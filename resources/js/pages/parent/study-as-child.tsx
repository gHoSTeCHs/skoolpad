import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Clock, Info } from 'lucide-react';
import ParentLayout from '@/layouts/parent-layout';
import type { StudyAsChildContext } from '@/types/parent';

interface StudyAsChildProps {
    context: StudyAsChildContext;
}

export default function StudyAsChild({ context }: StudyAsChildProps) {
    const firstName = context.child_name.split(' ')[0];
    const initial = context.child_name.charAt(0).toUpperCase();

    return (
        <ParentLayout breadcrumbs={[
            { title: 'Dashboard', href: '/parent/dashboard' },
            { title: `Study as ${firstName}`, href: '#' },
        ]}>
            <Head title={`Study as ${firstName}`} />

            <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
                {/* Context banner */}
                <div className="flex items-center justify-between rounded-lg border border-[var(--canopy-200)] bg-[var(--canopy-50)] px-4 py-3 dark:border-[var(--canopy-800)] dark:bg-[var(--canopy-950)]">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--canopy-600)] text-sm font-bold text-white">
                            {initial}
                        </div>
                        <p className="text-sm font-medium text-[var(--canopy-700)] dark:text-[var(--canopy-300)]">
                            Studying as <strong>{context.child_name}</strong>
                        </p>
                    </div>
                    <Link
                        href="/parent/dashboard"
                        className="flex items-center gap-1 text-xs font-medium text-[var(--canopy-600)] hover:text-[var(--canopy-800)] dark:hover:text-[var(--canopy-400)]"
                    >
                        <ArrowLeft className="size-3" />
                        Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div>
                    <h1 className="font-display text-2xl font-bold text-foreground">
                        {firstName}&apos;s Study Space
                    </h1>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            <Clock className="size-3" />
                            Daily goal: {context.study_goal_minutes} minutes
                        </span>
                        {context.is_secondary && (
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                Secondary
                            </span>
                        )}
                    </div>
                </div>

                {/* Subjects grid */}
                {context.subjects.length > 0 ? (
                    <div>
                        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Enrolled Subjects
                        </h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {context.subjects.map((subject) => (
                                <div
                                    key={subject.id}
                                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
                                >
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--canopy-50)] dark:bg-[var(--canopy-950)]">
                                        <BookOpen className="size-4 text-[var(--canopy-600)]" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        {subject.subject_name ?? 'Unnamed Subject'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                        <BookOpen className="mx-auto size-8 text-muted-foreground" />
                        <p className="mt-3 font-medium text-foreground">No subjects enrolled</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Subjects will appear here once {firstName}&apos;s profile is set up.
                        </p>
                    </div>
                )}

                {/* Info note */}
                <div className="flex items-start gap-2 rounded-lg bg-muted px-4 py-3">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        Activity during this session is tracked under {firstName}&apos;s account.
                        Practice sessions and topic completions will appear in their progress.
                    </p>
                </div>
            </div>
        </ParentLayout>
    );
}
