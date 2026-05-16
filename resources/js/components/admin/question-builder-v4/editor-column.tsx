import { findQuestion, findSectionOf } from './lib/drill';
import { AnchorStrip } from './anchor-strip';
import { MetadataForm } from './metadata-form';
import { QuestionHeader } from './question-header';
import { SaveBar } from './save-bar';
import { TYPE_META } from './lib/question-meta';
import { useBuilderV4Store } from './store/provider';
import type { QuestionNode, QuestionType } from '@/types/questions';

export function EditorColumn() {
    const paper = useBuilderV4Store((s) => s.paper);
    const selectedId = useBuilderV4Store((s) => s.selectedQuestionId);
    const col1Mode = useBuilderV4Store((s) => s.col1Mode);

    const selected = selectedId ? findQuestion(paper, selectedId) : null;
    const section = selected ? findSectionOf(paper, selected.id) : null;

    if (col1Mode === 'contexts' || !selected) {
        return (
            <main className="relative col-start-3 row-start-2 flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
                <EmptyState mode={col1Mode} />
            </main>
        );
    }

    return (
        <main className="relative col-start-3 row-start-2 flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
            <div className="flex-1 overflow-y-auto px-12 pt-8 pb-32">
                <QuestionHeader
                    paper={paper}
                    question={selected}
                    sectionLabel={section?.label ?? null}
                />

                <AnchorStrip questionType={selected.question_type} />

                <BodySection
                    id="sec-stem"
                    eyebrow="Section 1"
                    title="Stem"
                    landingCp="CP3"
                    blurb="The TipTap composer for the question stem — toolbar, math, code, tables, image and diagram insertion. Arrives in Checkpoint 3."
                />

                <BodySection
                    id="sec-body"
                    eyebrow="Section 2"
                    title={TYPE_META[selected.question_type].bodyAnchorLabel}
                    landingCp={typeBodyLandingCp(selected.question_type)}
                    blurb={typeBodyBlurb(selected.question_type)}
                />

                <BodySection
                    id="sec-answers"
                    eyebrow="Section 3"
                    title="Answer keys"
                    landingCp="CP5"
                    blurb="Quick / Standard / Deep dive — a 3-segment chip with one editor below, plus per-segment fill state. Arrives in Checkpoint 5."
                />

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
                    <MetadataForm key={selected.id} question={selected} />
                </section>
            </div>

            <SaveBar />
        </main>
    );
}

function BodySection({
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

function EmptyState({ mode }: { mode: 'sections' | 'contexts' }) {
    return (
        <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-md text-center">
                <div className="mx-auto inline-flex h-12 items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 font-mono text-[11px] tracking-[0.18em] text-[var(--fg-subtle)] uppercase">
                    QB · Checkpoint 2
                </div>
                <p className="mt-4 font-display text-[14px] font-medium text-foreground">
                    {mode === 'contexts'
                        ? 'Select a shared context to edit'
                        : 'Select a question to begin authoring'}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {mode === 'contexts'
                        ? 'Context editing wires up in Checkpoint 7. Switch back to a section in the left rail to use the metadata + status surface that ships in this checkpoint.'
                        : 'Pick any question in the second column. The sticky header, anchor strip, and metadata form will appear here.'}
                </p>
            </div>
        </div>
    );
}

function typeBodyLandingCp(type: QuestionType): string {
    return type === 'mcq' ? 'CP4' : 'CP8';
}

function typeBodyBlurb(type: QuestionType): string {
    if (type === 'mcq' || type === 'multi_select_mcq' || type === 'true_false') {
        return 'Option rows, correct toggle, reorder, add/delete. Multiple-choice authoring arrives in Checkpoint 4 (MCQ first).';
    }
    if (type === 'group') {
        return 'Sub-question list with inline create. Group authoring wires the drill-in for sub-question children. Arrives in Checkpoint 4/9.';
    }
    return 'Per-type authoring (matching pairs, ordering sequence, matrix, cloze gaps, etc.) arrives across Checkpoints 4 and 8 — reusing the MCQ pattern as the template.';
}
