import { router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface CoverageQuestionProps {
    topicTitle: string;
    weekNumber?: number;
    childId: string;
    topicId: string;
    onRespond: () => void;
}

export function CoverageQuestion({ topicTitle, weekNumber, childId, topicId, onRespond }: CoverageQuestionProps) {
    const [responded, setResponded] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    function handleResponse(status: 'covered' | 'not_yet_covered' | 'skipped') {
        setSubmitting(true);
        router.post(
            `/parent/children/${childId}/coverage/${topicId}`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResponded(true);
                    onRespond();
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    if (responded) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--canopy-200)] bg-[var(--canopy-50)] px-4 py-3 dark:border-[var(--canopy-800)] dark:bg-[var(--canopy-950)]">
                <CheckCircle2 className="size-4 shrink-0 text-[var(--canopy-600)]" />
                <span className="text-sm text-[var(--canopy-700)] dark:text-[var(--canopy-300)]">
                    Recorded — {topicTitle}
                </span>
            </div>
        );
    }

    return (
        <div className="rounded-lg border-l-4 border-l-amber-400 border-y border-r border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">
                Has the class covered <strong>{topicTitle}</strong> yet?
            </p>
            {weekNumber && (
                <p className="mt-0.5 text-xs text-muted-foreground">Expected in week {weekNumber}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResponse('covered')}
                    className="rounded-md bg-[var(--canopy-600)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--canopy-700)] disabled:opacity-50"
                >
                    Yes, covered
                </button>
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResponse('not_yet_covered')}
                    className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                    Not yet
                </button>
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResponse('skipped')}
                    className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                    Skipped by teacher
                </button>
            </div>
        </div>
    );
}
