import { findQuestion } from './lib/drill';
import { useBuilderV4Store } from './store/provider';

export function EditorPlaceholder() {
    const paper = useBuilderV4Store((s) => s.paper);
    const selectedId = useBuilderV4Store((s) => s.selectedQuestionId);
    const col1Mode = useBuilderV4Store((s) => s.col1Mode);

    const selected = selectedId ? findQuestion(paper, selectedId) : null;

    return (
        <main className="col-start-3 row-start-2 flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
            {selected && col1Mode === 'sections' ? (
                <header className="border-b border-[var(--border-2)] bg-card px-6 pt-4 pb-3">
                    <div className="flex items-baseline gap-2 font-mono text-[10.5px] tracking-wide text-[var(--fg-subtle)] uppercase">
                        <span>{selected.question_number ?? 'Selected'}</span>
                        <span aria-hidden>·</span>
                        <span>{selected.question_type.replace(/_/g, ' ')}</span>
                    </div>
                    <h2 className="mt-1 line-clamp-2 font-display text-[16px] font-semibold tracking-tight text-foreground">
                        {stripHtml(selected.content) || '(untitled question)'}
                    </h2>
                </header>
            ) : (
                <header className="border-b border-[var(--border-2)] bg-card px-6 pt-4 pb-3">
                    <div className="font-mono text-[10.5px] tracking-wide text-[var(--fg-subtle)] uppercase">
                        Editor
                    </div>
                    <p className="mt-1 font-display text-[15px] text-muted-foreground">
                        {col1Mode === 'contexts'
                            ? 'Select a shared context to edit'
                            : 'Select a question to begin authoring'}
                    </p>
                </header>
            )}

            <div className="flex min-h-0 flex-1 items-center justify-center px-6">
                <div className="max-w-md text-center">
                    <div className="mx-auto inline-flex h-12 items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 font-mono text-[11px] tracking-[0.18em] text-[var(--fg-subtle)] uppercase">
                        QB · Checkpoint 1
                    </div>
                    <p className="mt-4 font-display text-[14px] font-medium text-foreground">
                        Editor authoring lands in Checkpoint 2
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        This checkpoint ships the shell, drill navigation, and inspector sheet only.
                        The stem composer, per-type authors, answer-depth segmented control, and save
                        bar arrive in the next rounds.
                    </p>
                </div>
            </div>
        </main>
    );
}

function stripHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
