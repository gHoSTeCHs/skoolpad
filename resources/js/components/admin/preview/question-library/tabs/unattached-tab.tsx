import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Inbox, Trash2, X } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuestionLibraryController from '@/actions/App/Http/Controllers/Admin/QuestionLibraryController';
import type { BulkAssignAction, BulkAssignTargets, UnattachedQuestion } from '@/types/question-library';

interface UnattachedTabProps {
    questions: UnattachedQuestion[];
    targets: BulkAssignTargets;
}

const STATUS_COLOR: Record<string, string> = {
    draft: 'var(--fg-subtle)',
    in_review: 'var(--warning)',
    published: 'var(--success)',
    archived: 'var(--destructive)',
};

const ACTION_OPTIONS: { value: BulkAssignAction; label: string; needsTarget: boolean }[] = [
    { value: 'assign_course', label: 'Assign to course…', needsTarget: true },
    { value: 'assign_exam_subject', label: 'Assign to exam subject…', needsTarget: true },
    { value: 'attach_paper', label: 'Attach to paper…', needsTarget: true },
    { value: 'delete', label: 'Delete permanently', needsTarget: false },
];

function targetsFor(action: BulkAssignAction | '', targets: BulkAssignTargets) {
    switch (action) {
        case 'assign_course':
            return targets.courses;
        case 'assign_exam_subject':
            return targets.exam_subjects;
        case 'attach_paper':
            return targets.papers;
        default:
            return [];
    }
}

export function UnattachedTab({ questions, targets }: UnattachedTabProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [action, setAction] = useState<BulkAssignAction | ''>('');
    const [targetId, setTargetId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const allSelected = questions.length > 0 && selected.size === questions.length;
    const someSelected = selected.size > 0 && !allSelected;
    const actionMeta = useMemo(() => ACTION_OPTIONS.find((a) => a.value === action) ?? null, [action]);
    const availableTargets = useMemo(() => targetsFor(action, targets), [action, targets]);
    const canSubmit =
        action !== ''
        && selected.size > 0
        && (!actionMeta?.needsTarget || targetId !== '')
        && !submitting;

    function toggleRow(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(questions.map((q) => q.id)));
    }

    function clearSelection() {
        setSelected(new Set());
        setAction('');
        setTargetId('');
    }

    function submit() {
        if (!canSubmit || !action) return;
        setSubmitting(true);
        router.post(
            QuestionLibraryController.bulkAssignUnattached.url(),
            {
                question_ids: Array.from(selected),
                action,
                target_id: actionMeta?.needsTarget ? targetId : null,
            },
            {
                preserveScroll: true,
                only: ['unattached_questions', 'counts'],
                onSuccess: () => {
                    clearSelection();
                    setSubmitting(false);
                },
                onError: () => setSubmitting(false),
            },
        );
    }

    function handleApply() {
        if (action === 'delete') {
            setConfirmDeleteOpen(true);
            return;
        }
        submit();
    }

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
            {/* Banner / sticky bulk toolbar */}
            {selected.size === 0 ? (
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
                                no paper · no course · no exam-subject — select to bulk-assign
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="sticky top-2 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-[12px] border px-4 py-3 shadow-md"
                    style={{
                        borderColor: 'transparent',
                        background: 'var(--foreground)',
                        color: 'var(--background)',
                    }}
                >
                    <div
                        className="flex items-center gap-2 text-[12.5px] font-semibold"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        <span
                            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background px-1.5 text-[11px] font-bold text-foreground"
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            {selected.size}
                        </span>
                        selected
                    </div>

                    <div className="h-4 w-px bg-background/20" />

                    <Select
                        value={action}
                        onValueChange={(v) => {
                            setAction(v as BulkAssignAction);
                            setTargetId('');
                        }}
                    >
                        <SelectTrigger
                            className="h-8 w-[200px] border-background/25 bg-background/10 text-[12.5px] text-background hover:bg-background/15"
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            <SelectValue placeholder="Choose action…" />
                        </SelectTrigger>
                        <SelectContent>
                            {ACTION_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    <span className={opt.value === 'delete' ? 'text-destructive' : undefined}>
                                        {opt.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {actionMeta?.needsTarget && (
                        <Select value={targetId} onValueChange={setTargetId}>
                            <SelectTrigger
                                className="h-8 w-[280px] border-background/25 bg-background/10 text-[12.5px] text-background hover:bg-background/15"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                <SelectValue placeholder="Pick target…" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTargets.length === 0 ? (
                                    <div
                                        className="px-2 py-1.5 text-[12px] text-muted-foreground"
                                        style={{ fontFamily: 'var(--font-body)' }}
                                    >
                                        No options available.
                                    </div>
                                ) : (
                                    availableTargets.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.label}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-background/70 hover:bg-background/10 hover:text-background"
                            style={{ fontFamily: 'var(--font-body)' }}
                            disabled={submitting}
                        >
                            <X className="size-3" /> Clear
                        </button>
                        <Button
                            size="sm"
                            variant="secondary"
                            disabled={!canSubmit}
                            onClick={handleApply}
                            className="h-8 bg-background text-foreground hover:bg-background/90"
                        >
                            {submitting ? 'Applying…' : action === 'delete' ? (
                                <span className="flex items-center gap-1"><Trash2 className="size-3.5" /> Delete</span>
                            ) : 'Apply'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-[12px] border border-border bg-card">
                <div
                    className="flex items-center gap-4 border-b border-[var(--border-2)] bg-[var(--bg-raised)] px-4 py-2.5"
                >
                    <Checkbox
                        checked={allSelected || (someSelected && 'indeterminate')}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                    />
                    <div
                        className="text-[10px] uppercase tracking-[0.12em] text-[var(--fg-subtle)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {selected.size > 0 ? `${selected.size} of ${questions.length} selected` : `${questions.length} rows`}
                    </div>
                </div>

                {questions.map((q) => {
                    const isSelected = selected.has(q.id);
                    return (
                        <label
                            key={q.id}
                            className={
                                'flex cursor-pointer items-center gap-4 border-t border-[var(--border-2)] px-4 py-3 transition-colors '
                                + (isSelected ? 'bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]' : 'hover:bg-[var(--bg-raised)]')
                            }
                        >
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleRow(q.id)}
                                aria-label={`Select ${q.id}`}
                            />
                            <div
                                className="w-24 shrink-0 text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
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
                                        background:
                                            'color-mix(in srgb, ' + (STATUS_COLOR[q.status as string] ?? 'var(--fg-subtle)') + ' 12%, transparent)',
                                    }}
                                >
                                    {String(q.status).replace('_', ' ')}
                                </span>
                            </div>
                        </label>
                    );
                })}
            </div>

            <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selected.size} {selected.size === 1 ? 'question' : 'questions'}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently removes the selected unattached questions and all their answers.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setConfirmDeleteOpen(false);
                                submit();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
