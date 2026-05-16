import { cn } from '@/lib/utils';
import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';

export const DEPTH_ORDER: AnswerDepthLevel[] = ['quick', 'standard', 'deep_dive'];

export const DEPTH_META: Record<AnswerDepthLevel, { label: string; subscript: string; hint: string }> = {
    quick: {
        label: 'Quick',
        subscript: '~25 words',
        hint: 'One-line model answer — the gist a student needs to confirm correctness.',
    },
    standard: {
        label: 'Standard',
        subscript: '~120 words',
        hint: 'Working + reasoning. The answer a tutor would expect on a homework.',
    },
    deep_dive: {
        label: 'Deep dive',
        subscript: '~300+ words',
        hint: 'Full explanation with examples, edge cases, and why-it-matters context.',
    },
};

export type DepthFillState = 'full' | 'partial' | 'empty';

export function fillStateForDepth(question: QuestionNode, depth: AnswerDepthLevel): DepthFillState {
    const answer = question.answers?.find((a) => a.depth_level === depth);
    if (!answer) return 'empty';
    if (answer.is_published) return 'full';
    return 'partial';
}

interface DepthsBarProps {
    question: QuestionNode;
    activeDepth: AnswerDepthLevel;
    onSelect: (depth: AnswerDepthLevel) => void;
}

export function DepthsBar({ question, activeDepth, onSelect }: DepthsBarProps) {
    return (
        <div
            role="tablist"
            aria-label="Answer depth"
            className="mb-4 inline-flex items-center gap-0 rounded-lg border border-border bg-[var(--bg-raised)] p-1"
        >
            {DEPTH_ORDER.map((depth) => {
                const isActive = activeDepth === depth;
                const fill = fillStateForDepth(question, depth);
                const meta = DEPTH_META[depth];
                return (
                    <button
                        key={depth}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`depth-panel-${depth}`}
                        onClick={() => onSelect(depth)}
                        data-active={isActive}
                        data-fill={fill}
                        className={cn(
                            'group inline-flex items-center gap-2 rounded-md border border-transparent px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                            isActive
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <span
                            aria-hidden
                            className={cn(
                                'h-1.5 w-1.5 rounded-full transition-colors',
                                fill === 'full' && 'bg-[var(--success)]',
                                fill === 'partial' && 'bg-[var(--honey)]',
                                fill === 'empty' && 'bg-[var(--border-strong)]',
                            )}
                        />
                        <span>{meta.label}</span>
                        <span className="hidden font-mono text-[10px] tracking-wide text-[var(--fg-subtle)] sm:inline">
                            {meta.subscript}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
