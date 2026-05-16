import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuestionCard } from './question-card';
import { currentBreadcrumbs, currentLevelQuestions, findQuestion } from './lib/drill';
import { useBuilderV4Store } from './store/provider';
import type { QuestionContextData, QuestionPaper } from '@/types/questions';

export function QuestionsColumn() {
    const col1Mode = useBuilderV4Store((s) => s.col1Mode);

    if (col1Mode === 'contexts') {
        return <ContextsView />;
    }
    return <QuestionsView />;
}

function QuestionsView() {
    const paper = useBuilderV4Store((s) => s.paper);
    const activeSectionId = useBuilderV4Store((s) => s.activeSectionId);
    const drillPath = useBuilderV4Store((s) => s.drillPath);
    const selectedQuestionId = useBuilderV4Store((s) => s.selectedQuestionId);
    const selectQuestion = useBuilderV4Store((s) => s.requestSelectQuestion);
    const popDrillTo = useBuilderV4Store((s) => s.requestPopDrillTo);

    const crumbs = currentBreadcrumbs(paper, activeSectionId, drillPath);
    const items = currentLevelQuestions(paper, activeSectionId, drillPath);

    const title = resolveTitle(paper, activeSectionId, drillPath);

    return (
        <aside className="col-start-2 row-start-2 flex min-h-0 min-w-0 flex-col border-r border-border bg-card">
            <header className="border-b border-[var(--border-2)] px-3.5 pt-2.5 pb-2">
                <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 font-mono text-[10.5px] tracking-wide text-[var(--fg-subtle)]">
                    {crumbs.map((seg, i) => {
                        const isClickable = seg.popTo !== null;
                        const isLeaf = i === crumbs.length - 1;
                        return (
                            <span key={i} className="flex items-baseline gap-1">
                                {isClickable ? (
                                    <button
                                        type="button"
                                        onClick={() => popDrillTo(seg.popTo!)}
                                        className="rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-[var(--bg-raised)] hover:text-foreground"
                                    >
                                        {seg.label}
                                    </button>
                                ) : (
                                    <span className={cn('px-1', isLeaf && 'font-semibold text-foreground')}>
                                        {seg.label}
                                    </span>
                                )}
                                {i < crumbs.length - 1 && (
                                    <span aria-hidden className="opacity-60">›</span>
                                )}
                            </span>
                        );
                    })}
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h2 className="min-w-0 truncate font-display text-[13.5px] font-semibold tracking-tight text-foreground">
                        {title}
                    </h2>
                    <span className="shrink-0 font-mono text-[10.5px] text-[var(--fg-subtle)]">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {items.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                        No questions at this level yet.
                    </p>
                ) : (
                    items.map((q, i) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={i}
                            isSelected={q.id === selectedQuestionId}
                            onSelect={selectQuestion}
                        />
                    ))
                )}

                <button
                    type="button"
                    disabled
                    title={drillPath.length > 0 ? 'Sub-question creation lands in CP9' : 'Question creation lands in CP9'}
                    className="mt-2 flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-[12px] font-medium text-[var(--fg-subtle)] opacity-70"
                >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {drillPath.length > 0 ? 'Add sub-question' : 'Add question'}
                </button>
            </div>
        </aside>
    );
}

function resolveTitle(paper: QuestionPaper, activeSectionId: string | null, drillPath: string[]): string {
    if (drillPath.length > 0) {
        const deepest = findQuestion(paper, drillPath[drillPath.length - 1]);
        if (deepest) {
            return deepest.question_number
                ? `${deepest.question_number} — sub-questions`
                : 'Sub-questions';
        }
    }
    const section = paper.sections.find((s) => s.id === activeSectionId);
    return section?.label ?? 'Questions';
}

function ContextsView() {
    const paper = useBuilderV4Store((s) => s.paper);
    const contexts = paper.contexts;

    return (
        <aside className="col-start-2 row-start-2 flex min-h-0 min-w-0 flex-col border-r border-border bg-card">
            <header className="border-b border-[var(--border-2)] px-3.5 pt-2.5 pb-2">
                <div className="font-mono text-[9.5px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                    Paper resources
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <h2 className="min-w-0 truncate font-display text-[13.5px] font-semibold tracking-tight text-foreground">
                        Shared contexts
                    </h2>
                    <span className="shrink-0 font-mono text-[10.5px] text-[var(--fg-subtle)]">
                        {contexts.length} {contexts.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {contexts.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                        No shared contexts on this paper yet.
                    </p>
                ) : (
                    contexts.map((ctx) => <ContextRow key={ctx.id} ctx={ctx} />)
                )}

                <button
                    type="button"
                    disabled
                    title="Context authoring lands in CP7"
                    className="mt-2 flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-[12px] font-medium text-[var(--fg-subtle)] opacity-70"
                >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Add context
                </button>
            </div>
        </aside>
    );
}

function ContextRow({ ctx }: { ctx: QuestionContextData }) {
    const label = ctx.title?.trim() || titleFromContent(ctx) || 'Untitled context';
    return (
        <div className="rounded-md border border-transparent px-3 py-2 hover:bg-[var(--bg-raised)]">
            <div className="flex items-baseline gap-2">
                <span className="font-mono text-[9.5px] font-semibold tracking-wider text-[var(--honey)] uppercase">
                    {ctx.context_type}
                </span>
                <span className="line-clamp-1 text-[12px] text-foreground">{label}</span>
            </div>
        </div>
    );
}

function titleFromContent(ctx: QuestionContextData): string {
    if (ctx.content) return ctx.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    return '';
}
