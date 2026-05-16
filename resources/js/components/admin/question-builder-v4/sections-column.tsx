import { BookOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionRow } from './section-row';
import { useBuilderV4Store } from './store/provider';
import type { QuestionNode } from '@/types/questions';

function totalQuestionCount(questions: QuestionNode[]): number {
    let count = questions.length;
    for (const q of questions) {
        count += totalQuestionCount(q.children ?? []);
    }
    return count;
}

export function SectionsColumn() {
    const paper = useBuilderV4Store((s) => s.paper);
    const col1Mode = useBuilderV4Store((s) => s.col1Mode);
    const activeSectionId = useBuilderV4Store((s) => s.activeSectionId);
    const selectSection = useBuilderV4Store((s) => s.selectSection);
    const activateContexts = useBuilderV4Store((s) => s.activateContexts);

    const sectionCount = paper.sections.length;
    const questionCount = paper.sections.reduce(
        (acc, s) => acc + totalQuestionCount(s.questions),
        0,
    );
    const contextCount = paper.contexts.length;

    return (
        <aside className="col-start-1 row-start-2 flex min-h-0 min-w-0 flex-col border-r border-border bg-card">
            <header className="border-b border-[var(--border-2)] bg-gradient-to-b from-card to-[var(--bg-raised)] px-4 pt-3 pb-2.5">
                <div className="font-mono text-[9.5px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                    Paper
                </div>
                <h2 className="mt-0.5 line-clamp-2 font-display text-[13.5px] font-semibold leading-snug tracking-tight text-foreground">
                    {paper.title}
                </h2>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-[var(--fg-subtle)]">
                    <span>
                        {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
                    </span>
                    <span aria-hidden className="h-[3px] w-[3px] rounded-full bg-[var(--fg-subtle)]" />
                    <span>
                        {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                    </span>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-2 pb-6">
                {paper.sections.map((section, i) => (
                    <SectionRow
                        key={section.id}
                        section={section}
                        index={i}
                        isSelected={col1Mode === 'sections' && activeSectionId === section.id}
                        onSelect={selectSection}
                    />
                ))}

                <button
                    type="button"
                    disabled
                    title="Section creation lands in CP9"
                    className="mt-2 ml-1 flex w-[calc(100%-0.25rem)] items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-[12px] font-medium text-[var(--fg-subtle)] opacity-70"
                >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Add section
                </button>

                <div className="mx-3 mt-3 border-t border-dashed border-border pt-3 font-mono text-[9.5px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                    Paper resources
                </div>

                <button
                    type="button"
                    onClick={activateContexts}
                    aria-current={col1Mode === 'contexts' ? 'true' : undefined}
                    className={cn(
                        'group mt-1.5 -ml-px flex w-full items-center gap-2.5 rounded-md border-l-2 px-3 py-2.5 text-left transition-colors',
                        col1Mode === 'contexts'
                            ? 'border-[var(--honey)] bg-secondary'
                            : 'border-transparent hover:bg-[var(--bg-raised)]',
                    )}
                >
                    <span
                        aria-hidden
                        className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--honey-soft)] text-[var(--honey)]"
                    >
                        <BookOpen className="h-3 w-3" />
                    </span>
                    <span className="flex-1 truncate text-[12px] font-medium text-foreground">
                        Shared contexts
                    </span>
                    <span className="font-mono text-[10px] text-[var(--fg-subtle)]">{contextCount}</span>
                </button>
            </div>
        </aside>
    );
}
