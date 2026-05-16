import { findQuestion } from './lib/drill';
import { QuestionEditor } from './question-editor';
import { SaveBar } from './save-bar';
import { useBuilderV4Store } from './store/provider';

export function EditorColumn() {
    const paper = useBuilderV4Store((s) => s.paper);
    const selectedId = useBuilderV4Store((s) => s.selectedQuestionId);
    const col1Mode = useBuilderV4Store((s) => s.col1Mode);

    const selected = selectedId ? findQuestion(paper, selectedId) : null;

    if (col1Mode === 'contexts' || !selected) {
        return (
            <main className="relative col-start-3 row-start-2 flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
                <EmptyState mode={col1Mode} />
            </main>
        );
    }

    return (
        <main className="relative col-start-3 row-start-2 flex min-h-0 min-w-0 flex-col overflow-hidden bg-background">
            <div className="flex-1 overflow-y-auto px-12 pb-32">
                <QuestionEditor key={selected.id} paper={paper} question={selected} />
            </div>
            <SaveBar />
        </main>
    );
}

function EmptyState({ mode }: { mode: 'sections' | 'contexts' }) {
    return (
        <div className="flex flex-1 items-center justify-center px-6">
            <div className="max-w-md text-center">
                <div className="mx-auto inline-flex h-12 items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 font-mono text-[11px] tracking-[0.18em] text-[var(--fg-subtle)] uppercase">
                    QB · Checkpoint 3
                </div>
                <p className="mt-4 font-display text-[14px] font-medium text-foreground">
                    {mode === 'contexts'
                        ? 'Select a shared context to edit'
                        : 'Select a question to begin authoring'}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {mode === 'contexts'
                        ? 'Context editing wires up in Checkpoint 7. Switch back to a section in the left rail to use the metadata + status surface that ships in this checkpoint.'
                        : 'Pick any question in the second column. The sticky header, anchor strip, stem composer, and metadata form will appear here.'}
                </p>
            </div>
        </div>
    );
}
