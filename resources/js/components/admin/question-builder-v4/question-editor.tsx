'use no memo';

import { useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';
import QuestionController from '@/actions/App/Http/Controllers/Admin/QuestionController';
import { AnchorStrip } from './anchor-strip';
import { AnswersBody } from './answers-body';
import { findSectionOf } from './lib/drill';
import { McqBody } from './mcq-body';
import { MetadataForm } from './metadata-form';
import { QuestionHeader } from './question-header';
import {
    deriveContentDoc,
    type QuestionFormBridge,
    type QuestionFormData,
} from './question-form';
import { StemForm } from './stem-form';
import { TYPE_META } from './lib/question-meta';
import { useDirtyRegistration } from './hooks/use-dirty-registration';
import { useBuilderV4Store } from './store/provider';
import type {
    QuestionNode,
    QuestionPaper,
    QuestionType,
    ResponseConfig,
} from '@/types/questions';

interface QuestionEditorProps {
    paper: QuestionPaper;
    question: QuestionNode;
}

function defaultConfigForType(type: QuestionType): ResponseConfig {
    if (type === 'mcq' || type === 'multi_select_mcq') {
        return {
            options: [
                { label: 'A', text: '', is_correct: false },
                { label: 'B', text: '', is_correct: false },
            ],
        };
    }
    return null;
}

function buildInitial(q: QuestionNode): QuestionFormData {
    const content = q.content ?? '';
    return {
        question_type: q.question_type,
        marks: q.marks ?? '',
        difficulty_level: q.difficulty_level ?? '',
        bloom_level: q.bloom_level ?? '',
        content,
        content_doc: q.content_doc ?? deriveContentDoc(content),
        response_config: q.response_config ?? defaultConfigForType(q.question_type),
    };
}

export function QuestionEditor({ paper, question }: QuestionEditorProps) {
    const saveNonce = useBuilderV4Store((s) => s.saveRequestNonce);
    const form = useForm<QuestionFormData>(buildInitial(question));

    const reset = useCallback(() => form.reset(), [form]);
    useDirtyRegistration('question', form.isDirty, reset);

    const lastHandled = useRef<number>(saveNonce);
    const submit = useCallback(() => {
        form.put(QuestionController.update.url({ question: question.id }), {
            preserveScroll: true,
            preserveState: true,
            only: ['paper'],
            onSuccess: () => form.setDefaults(),
        });
    }, [form, question.id]);

    useEffect(() => {
        if (saveNonce !== lastHandled.current) {
            lastHandled.current = saveNonce;
            if (form.isDirty) submit();
        }
    }, [saveNonce, form.isDirty, submit]);

    const section = findSectionOf(paper, question.id);

    const bridge: QuestionFormBridge = {
        data: form.data,
        errors: form.errors as Partial<Record<keyof QuestionFormData, string>>,
        setField: (key, value) => form.setData(key as string, value),
    };

    return (
        <>
            <div className="sticky top-0 z-10 -mx-12 mb-7 bg-background after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-4 after:h-4 after:bg-gradient-to-b after:from-background after:to-transparent">
                <QuestionHeader paper={paper} question={question} sectionLabel={section?.label ?? null} />
                <AnchorStrip questionType={question.question_type} />
            </div>

            <section
                id="sec-stem"
                aria-labelledby="sec-stem-heading"
                className="mt-2 mb-8"
            >
                <div className="mb-3">
                    <div className="font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                        Section 1
                    </div>
                    <h2
                        id="sec-stem-heading"
                        className="mt-0.5 font-display text-[16px] font-semibold tracking-tight text-foreground"
                    >
                        Stem
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        The question as students will read it.
                    </p>
                </div>
                <StemForm form={bridge} questionId={question.id} />
            </section>

            <BodyDispatch form={bridge} type={question.question_type} />

            <AnswersBody question={question} />

            <section
                id="sec-meta"
                aria-labelledby="sec-meta-heading"
                className="mt-2 rounded-lg border border-border bg-card p-6"
            >
                <div className="mb-4 flex items-baseline justify-between gap-3">
                    <div>
                        <div className="font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                            Section 4
                        </div>
                        <h2
                            id="sec-meta-heading"
                            className="mt-0.5 font-display text-[16px] font-semibold tracking-tight text-foreground"
                        >
                            Metadata
                        </h2>
                    </div>
                </div>
                <MetadataForm form={bridge} />
            </section>
        </>
    );
}

function BodyDispatch({ form, type }: { form: QuestionFormBridge; type: QuestionType }) {
    if (type === 'mcq' || type === 'multi_select_mcq') {
        return <McqBody form={form} mode={type} />;
    }

    const blurb =
        type === 'true_false'
            ? 'True/False is structurally MCQ with two fixed options. Arrives in Checkpoint 8.'
            : type === 'group'
              ? 'Sub-question list with inline create. Group authoring wires the drill-in for sub-question children. Arrives in Checkpoint 9.'
              : 'Per-type authoring (matching pairs, ordering sequence, matrix, cloze gaps, etc.) arrives in Checkpoint 8 — reusing the MCQ pattern as the template.';
    return (
        <PlaceholderSection
            id="sec-body"
            eyebrow="Section 2"
            title={TYPE_META[type].bodyAnchorLabel}
            landingCp="CP8"
            blurb={blurb}
        />
    );
}

function PlaceholderSection({
    id,
    eyebrow,
    title,
    landingCp,
    blurb,
}: {
    id: string;
    eyebrow: string;
    title: string;
    landingCp: string;
    blurb: string;
}) {
    return (
        <section
            id={id}
            aria-labelledby={`${id}-heading`}
            className="mt-2 mb-8 rounded-lg border border-dashed border-border bg-card/50 p-6"
        >
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <div className="font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                        {eyebrow}
                    </div>
                    <h2
                        id={`${id}-heading`}
                        className="mt-0.5 font-display text-[16px] font-semibold tracking-tight text-foreground"
                    >
                        {title}
                    </h2>
                </div>
                <span className="rounded border border-border bg-[var(--bg-raised)] px-2 py-0.5 font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                    {landingCp}
                </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{blurb}</p>
        </section>
    );
}
