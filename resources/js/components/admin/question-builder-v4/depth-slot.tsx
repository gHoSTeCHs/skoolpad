'use no memo';

import { useForm } from '@inertiajs/react';
import { Check, PenSquare, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { sileo } from 'sileo';
import AnswerController from '@/actions/App/Http/Controllers/Admin/AnswerController';
import { TiptapEditor } from '@/components/shared/tiptap-editor';
import { cn } from '@/lib/utils';
import { useDirtyRegistration } from './hooks/use-dirty-registration';
import { DEPTH_META } from './depths-bar';
import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

type AnswerRow = NonNullable<QuestionNode['answers']>[number];

interface DepthSlotProps {
    question: QuestionNode;
    depth: AnswerDepthLevel;
    active: boolean;
}

interface AnswerFormData {
    depth_level: AnswerDepthLevel;
    content: TiptapJSON;
    content_plain: string;
    is_published: boolean;
    [key: string]: AnswerDepthLevel | TiptapJSON | string | boolean;
}

function emptyDoc(): TiptapJSON {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
}

function buildInitial(answer: AnswerRow | undefined, depth: AnswerDepthLevel): AnswerFormData {
    return {
        depth_level: depth,
        content: (answer?.content as TiptapJSON | null) ?? emptyDoc(),
        content_plain: answer?.content_plain ?? '',
        is_published: answer?.is_published ?? false,
    };
}

export function DepthSlot({ question, depth, active }: DepthSlotProps) {
    const answer = useMemo(
        () => question.answers?.find((a) => a.depth_level === depth),
        [question.answers, depth],
    );
    const meta = DEPTH_META[depth];

    const [editing, setEditing] = useState(false);

    const form = useForm<AnswerFormData>(buildInitial(answer, depth));

    const reset = useCallback(() => {
        form.reset();
        setEditing(false);
    }, [form]);
    useDirtyRegistration(`answers:${depth}`, form.isDirty, reset);

    const showEditor = !!answer || editing;

    function handleWrite() {
        setEditing(true);
    }

    function handleGenerate() {
        sileo.info({
            title: 'AI answer generation lands in CP10',
            description: 'For now, use "Write manually" to author this depth\'s answer.',
        });
    }

    function handleSave() {
        if (!form.isDirty) return;
        if (answer) {
            form.put(
                AnswerController.update.url({ question: question.id, answer: answer.id }),
                {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['paper'],
                    onSuccess: () => form.setDefaults(),
                },
            );
        } else {
            form.post(AnswerController.store.url({ question: question.id }), {
                preserveScroll: true,
                preserveState: true,
                only: ['paper'],
                onSuccess: () => {
                    form.setDefaults();
                    setEditing(false); // server-rendered answer will drive showEditor
                },
            });
        }
    }

    if (!active) return null;

    return (
        <div
            id={`depth-panel-${depth}`}
            role="tabpanel"
            aria-labelledby={`depth-tab-${depth}`}
            className="rounded-lg border border-border bg-card p-5"
        >
            <header className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-display text-[14px] font-semibold tracking-tight text-foreground">
                        {meta.label}
                    </h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{meta.hint}</p>
                </div>
                {answer?.is_published && (
                    <span
                        aria-label="Published"
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--correct-line)] bg-[var(--correct-bg)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--correct-dot)]"
                    >
                        <Check className="h-3 w-3" aria-hidden />
                        Approved
                    </span>
                )}
            </header>

            {!showEditor ? (
                <EmptyState depthLabel={meta.label} onWrite={handleWrite} onGenerate={handleGenerate} />
            ) : (
                <div className="space-y-3">
                    <TiptapEditor
                        value={form.data.content}
                        onChange={(json, plain) => {
                            form.setData('content', json);
                            form.setData('content_plain', plain);
                        }}
                        placeholder={`Write the ${meta.label.toLowerCase()} answer…`}
                        diagramOwner={{ kind: 'question', id: question.id }}
                    />
                    {form.errors.content && (
                        <p className="text-[11.5px] text-destructive">{form.errors.content}</p>
                    )}
                    <footer className="flex items-center justify-between gap-3 border-t border-border pt-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground select-none">
                            <input
                                type="checkbox"
                                checked={form.data.is_published}
                                onChange={(e) => form.setData('is_published', e.target.checked)}
                                className="h-3.5 w-3.5 cursor-pointer rounded border-border accent-primary"
                            />
                            Publish this answer
                        </label>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!form.isDirty || form.processing}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                                form.isDirty
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'cursor-not-allowed bg-[var(--bg-raised)] text-[var(--fg-subtle)]',
                            )}
                        >
                            {form.processing ? 'Saving…' : answer ? 'Save changes' : 'Create answer'}
                        </button>
                    </footer>
                </div>
            )}
        </div>
    );
}

interface EmptyStateProps {
    depthLabel: string;
    onWrite: () => void;
    onGenerate: () => void;
}

function EmptyState({ depthLabel, onWrite, onGenerate }: EmptyStateProps) {
    return (
        <div className="rounded-md border border-dashed border-border bg-[var(--bg-raised)]/40 px-5 py-6">
            <p className="text-center text-[12.5px] text-muted-foreground italic">
                No {depthLabel.toLowerCase()} answer yet.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={onWrite}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                    <PenSquare className="h-3.5 w-3.5" aria-hidden />
                    Write manually
                </button>
                <button
                    type="button"
                    onClick={onGenerate}
                    title="AI generation lands in Checkpoint 10"
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--honey-line)] bg-card px-3 py-1.5 text-[12.5px] font-medium text-[var(--honey)] transition-colors hover:bg-[var(--honey-soft)]"
                >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Generate with AI
                </button>
            </div>
        </div>
    );
}
