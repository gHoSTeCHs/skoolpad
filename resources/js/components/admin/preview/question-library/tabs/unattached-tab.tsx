import { Inbox } from 'lucide-react';
import type { UnattachedQuestion } from '@/types/question-library';

interface UnattachedTabProps {
    questions: UnattachedQuestion[];
}

const STATUS_COLOR: Record<string, string> = {
    draft: 'var(--fg-subtle)',
    in_review: 'var(--warning)',
    published: 'var(--success)',
    archived: 'var(--destructive)',
};

export function UnattachedTab({ questions }: UnattachedTabProps) {
    if (questions.length === 0) {
        return (
            <div className="px-[30px] py-16 text-center">
                <Inbox className="mx-auto size-8 text-[var(--fg-subtle)]" />
                <p
                    className="mt-3 text-[14px] text-muted-foreground"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    Inbox zero. No unattached questions waiting for triage.
                </p>
            </div>
        );
    }

    return (
        <div className="px-[30px] pt-6 pb-8">
            <div
                className="mb-4 flex items-center justify-between rounded-[10px] border px-4 py-3"
                style={{
                    borderColor: 'var(--warning)',
                    background: 'color-mix(in srgb, var(--warning) 8%, transparent)',
                }}
            >
                <div className="flex items-center gap-2.5">
                    <Inbox className="size-4 text-[var(--warning)]" />
                    <div>
                        <div
                            className="text-[12.5px] font-semibold text-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            {questions.length} unattached {questions.length === 1 ? 'question' : 'questions'}
                        </div>
                        <div
                            className="text-[11px] text-muted-foreground"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            no paper · no course · no exam-subject — bulk-assign in 4.H
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[12px] border border-border bg-card">
                {questions.map((q, idx) => (
                    <div
                        key={q.id}
                        className={
                            'flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--bg-raised)] '
                            + (idx > 0 ? 'border-t border-[var(--border-2)]' : '')
                        }
                    >
                        <div
                            className="w-20 shrink-0 text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            {q.question_type.replace('_', ' ')}
                        </div>
                        <div
                            className="min-w-0 flex-1 truncate text-[13px] text-foreground"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            {q.stem_preview || <span className="text-[var(--fg-subtle)]">(no stem)</span>}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span
                                className="rounded-full px-2 py-[1px] text-[10px] uppercase tracking-[0.04em]"
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    color: STATUS_COLOR[q.status as string] ?? 'var(--fg-subtle)',
                                    background: 'color-mix(in srgb, ' + (STATUS_COLOR[q.status as string] ?? 'var(--fg-subtle)') + ' 12%, transparent)',
                                }}
                            >
                                {String(q.status).replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
