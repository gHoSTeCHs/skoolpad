import { useState } from 'react';
import SpBadge from '@/components/skoolpad/sp-badge';
import QuestionTypeBadge from './question-type-badge';
import AnswerKeyBody from './answer-key-body';
import { ContentRenderer } from '@/components/shared/content-renderer';
import type { RenderableContent } from '@/types/tiptap';

/**
 * Showcase-compatible question shape (camelCase).
 * Used by the architecture showcase and paper builder preview.
 */
export interface ShowcaseQuestion {
    number: string;
    displayLabel: string;
    type: string;
    content: RenderableContent;
    marks: number | null;
    sharedContext?: string;
    contextId?: string;
    contextIds?: string[];
    options?: { label: string; text: string; isCorrect?: boolean }[];
    matchingPairs?: { left: string; right: string }[];
    matchingDistractors?: string[];
    orderItems?: string[];
    correctOrder?: number[];
    trueFalseAnswer?: boolean;
    requiresJustification?: boolean;
    diagramLabels?: { label: string; answer: string }[];
    calculationAnswer?: string;
    calculationUnit?: string;
    gapOptions?: { position: number; options: string[]; correct: number }[];
    fillBlanks?: string[];
    assertion?: string;
    reason?: string;
    matrixLeft?: string[];
    matrixRight?: string[];
    matrixMapping?: Record<number, number[]>;
    numericAnswer?: number;
    numericTolerance?: number;
    numericUnit?: string;
    choiceGroup?: { required: string[]; chooseN: number; optional: string[] };
    children: ShowcaseQuestion[];
}

export default function QuestionRenderer({ q, depth = 0 }: { q: ShowcaseQuestion; depth?: number }) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = q.children.length > 0;
    const isLeaf = !hasChildren;

    return (
        <div className={depth > 0 ? 'ml-5 border-l border-border/40 pl-4' : ''}>
            <div
                className={'flex items-start gap-2 rounded-lg px-3 py-2 transition-colors' + (isLeaf ? ' hover:bg-[var(--bg-raised)]' : '')}
            >
                {hasChildren ? (
                    <button onClick={() => setIsOpen(!isOpen)} className="mt-0.5 cursor-pointer border-none bg-transparent p-0 text-[10px] text-muted-foreground transition-transform duration-150" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                        {'\u25B6'}
                    </button>
                ) : (
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                )}

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-primary" style={{ fontFamily: 'var(--font-body)' }}>{q.number}</span>
                        <QuestionTypeBadge type={q.type} />
                    </div>
                    {q.content && (
                        typeof q.content === 'string' ? (
                            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>{q.content}</p>
                        ) : (
                            <ContentRenderer
                                content={q.content}
                                className="mt-1 text-[13px] leading-relaxed"
                            />
                        )
                    )}
                    <AnswerKeyBody q={q} />
                </div>

                {q.marks !== null && (
                    <span className="shrink-0 rounded-md bg-[var(--bg-raised)] px-2 py-0.5 text-[10px] font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        {q.marks}m
                    </span>
                )}
            </div>

            {hasChildren && isOpen && (
                <div className="mt-1">
                    {q.children.map((child) => (
                        <QuestionRenderer key={child.number} q={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
