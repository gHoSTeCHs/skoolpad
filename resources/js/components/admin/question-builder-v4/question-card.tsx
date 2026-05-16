import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_META } from './lib/question-meta';
import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';

const DEPTHS: AnswerDepthLevel[] = ['quick', 'standard', 'deep_dive'];

type DotState = 'full' | 'partial' | 'empty';

function depthDot(question: QuestionNode, depth: AnswerDepthLevel): DotState {
    const ans = question.answers?.find((a) => a.depth_level === depth);
    if (!ans) return 'empty';
    return ans.is_published ? 'full' : 'partial';
}

function stripHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function stemExcerpt(question: QuestionNode, max = 80): string {
    const text = stripHtml(question.content);
    if (!text) return '(untitled)';
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
}

interface QuestionCardProps {
    question: QuestionNode;
    index: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export function QuestionCard({ question, index, isSelected, onSelect }: QuestionCardProps) {
    const childCount = question.children?.length ?? 0;
    const isGroup = childCount > 0;
    const qNumber =
        question.question_number ||
        question.display_label ||
        `Q${index + 1}`;

    return (
        <button
            type="button"
            onClick={() => onSelect(question.id)}
            aria-current={isSelected ? 'true' : undefined}
            className={cn(
                'group flex w-full items-start gap-2.5 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors',
                isSelected
                    ? 'border-[var(--border-2)] bg-[var(--bg-raised)]'
                    : 'hover:bg-[var(--bg-raised)]',
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'mt-px shrink-0 font-mono text-[11px] font-medium tabular-nums',
                    isSelected ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {qNumber}
            </span>

            <div className="min-w-0 flex-1">
                <p
                    className={cn(
                        'line-clamp-2 text-[12.5px] leading-snug',
                        isSelected ? 'text-foreground' : 'text-foreground/85',
                    )}
                >
                    {stemExcerpt(question)}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="rounded-sm bg-[var(--bg-raised)] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {TYPE_META[question.question_type]?.short ?? question.question_type.toUpperCase().slice(0, 4)}
                    </span>
                    {question.marks != null && (
                        <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
                            {question.marks}m
                        </span>
                    )}
                    {isGroup && (
                        <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
                            · {childCount} sub
                        </span>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 pt-px">
                <span
                    className="flex items-center gap-[3px]"
                    title="Answer fill: quick · standard · deep dive"
                    aria-label={`Answer fill: quick ${depthDot(question, 'quick')}, standard ${depthDot(question, 'standard')}, deep dive ${depthDot(question, 'deep_dive')}`}
                >
                    {DEPTHS.map((d) => {
                        const state = depthDot(question, d);
                        return (
                            <span
                                key={d}
                                className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    state === 'full' && 'bg-[var(--success)]',
                                    state === 'partial' && 'bg-[var(--honey)]',
                                    state === 'empty' && 'bg-border',
                                )}
                            />
                        );
                    })}
                </span>
                {isGroup && (
                    <ChevronRight
                        className="h-3.5 w-3.5 text-[var(--fg-subtle)] transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                    />
                )}
            </div>
        </button>
    );
}
