import { useState } from 'react';
import SpBadge from '@/components/skoolpad/sp-badge';
import QuestionTypeBadge from './question-type-badge';

/**
 * Showcase-compatible question shape (camelCase).
 * Used by the architecture showcase and paper builder preview.
 */
export interface ShowcaseQuestion {
    number: string;
    displayLabel: string;
    type: string;
    content: string;
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
                        <p className="mt-1 text-[13px] leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>{q.content}</p>
                    )}
                    {q.options && (
                        <div className="mt-2 space-y-1">
                            {q.options.map((opt) => (
                                <div
                                    key={opt.label}
                                    className={'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px]'
                                        + (opt.isCorrect
                                            ? ' border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)]'
                                            : ' border-border')}
                                    style={{ fontFamily: 'var(--font-body)' }}
                                >
                                    <span className={'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold'
                                        + (opt.isCorrect ? ' bg-[var(--opt-correct-dot)] text-white' : ' bg-[var(--bg-raised)]')}>
                                        {opt.isCorrect ? '\u2713' : opt.label}
                                    </span>
                                    <span>{opt.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {q.matchingPairs && (
                        <div className="mt-2 space-y-1">
                            {q.matchingPairs.map((pair, i) => (
                                <div key={i} className="flex items-center gap-2 text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                                    <span className="w-[140px] shrink-0 rounded border border-border bg-[var(--bg-raised)] px-2 py-1 text-center font-medium">{pair.left}</span>
                                    <span className="text-primary">{'\u2194'}</span>
                                    <span className="flex-1 rounded border border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)] px-2 py-1">{pair.right}</span>
                                </div>
                            ))}
                            {q.matchingDistractors && q.matchingDistractors.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {q.matchingDistractors.map((d, i) => (
                                        <span key={i} className="rounded border border-border bg-[var(--bg-raised)] px-2 py-0.5 text-[10px] text-muted-foreground line-through">{d}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {q.orderItems && (
                        <div className="mt-2 space-y-1">
                            {q.orderItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-[12px]" style={{ fontFamily: 'var(--font-body)' }}>
                                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                                        {q.correctOrder ? q.correctOrder[i] : i + 1}
                                    </span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {q.type === 'true_false' && q.trueFalseAnswer !== undefined && (
                        <div className="mt-2 flex items-center gap-3">
                            <span className={'rounded-md px-3 py-1 text-[11px] font-bold' + (q.trueFalseAnswer ? ' bg-[var(--opt-correct-bg)] text-[var(--opt-correct-dot)]' : ' bg-[var(--bg-raised)] text-muted-foreground')}>TRUE</span>
                            <span className={'rounded-md px-3 py-1 text-[11px] font-bold' + (!q.trueFalseAnswer ? ' bg-[var(--destructive)]/10 text-[var(--destructive)]' : ' bg-[var(--bg-raised)] text-muted-foreground')}>FALSE</span>
                            {q.requiresJustification && <span className="text-[10px] italic text-muted-foreground">(justify your answer)</span>}
                        </div>
                    )}
                    {q.diagramLabels && (
                        <div className="mt-2 grid grid-cols-2 gap-1">
                            {q.diagramLabels.map((dl, i) => (
                                <div key={i} className="flex items-center gap-2 rounded border border-border px-2 py-1 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                    <span className="font-bold text-primary">{dl.label}:</span>
                                    <span className="text-muted-foreground">{dl.answer}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {q.type === 'calculation' && q.calculationAnswer && (
                        <div className="mt-2 flex items-center gap-2">
                            <span className="rounded border border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)] px-3 py-1 text-[12px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>
                                = {q.calculationAnswer}{q.calculationUnit ? ` ${q.calculationUnit}` : ''}
                            </span>
                        </div>
                    )}
                    {q.gapOptions && (
                        <div className="mt-2 space-y-1">
                            {q.gapOptions.map((gap) => (
                                <div key={gap.position} className="flex items-center gap-2 text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                    <span className="shrink-0 font-bold text-primary">Gap {gap.position}:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {gap.options.map((opt, oi) => (
                                            <span key={oi} className={'rounded px-2 py-0.5' + (oi === gap.correct ? ' border border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)] font-bold' : ' bg-[var(--bg-raised)]')}>{opt}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {q.type === 'assertion_reason' && q.assertion && q.reason && (
                        <div className="mt-2 space-y-1.5 rounded-md border border-border bg-[var(--bg-raised)] p-3">
                            <div className="text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                <span className="font-bold text-primary">Assertion:</span> <span>{q.assertion}</span>
                            </div>
                            <div className="text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                <span className="font-bold text-[var(--warning)]">Reason:</span> <span>{q.reason}</span>
                            </div>
                        </div>
                    )}
                    {q.type === 'matrix_matching' && q.matrixLeft && q.matrixRight && q.matrixMapping && (
                        <div className="mt-2 overflow-x-auto rounded-md border border-border">
                            <table className="w-full text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
                                <thead>
                                    <tr className="bg-[var(--bg-raised)]">
                                        <th className="border-b border-r border-border px-2 py-1.5 text-left font-bold">Column I</th>
                                        {q.matrixRight.map((r, i) => (
                                            <th key={i} className="border-b border-border px-2 py-1.5 text-center font-bold text-primary">{String.fromCharCode(80 + i)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {q.matrixLeft.map((item, li) => (
                                        <tr key={li} className="border-b border-border/30 last:border-b-0">
                                            <td className="border-r border-border px-2 py-1.5 font-medium">{li + 1}. {item}</td>
                                            {q.matrixRight!.map((_, ri) => (
                                                <td key={ri} className="px-2 py-1.5 text-center">
                                                    {q.matrixMapping![li]?.includes(ri)
                                                        ? <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--opt-correct-dot)] text-[9px] text-white">{'\u2713'}</span>
                                                        : <span className="text-border">{'\u2013'}</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="border-t border-border bg-[var(--bg-raised)] px-2 py-1.5">
                                <span className="text-[10px] font-medium text-muted-foreground">Column II: </span>
                                {q.matrixRight.map((r, i) => (
                                    <span key={i} className="text-[10px] text-muted-foreground">
                                        <strong className="text-primary">{String.fromCharCode(80 + i)}</strong> = {r}{i < q.matrixRight!.length - 1 ? ', ' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {q.type === 'numeric_entry' && q.numericAnswer !== undefined && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="inline-flex items-center gap-1 rounded border-2 border-dashed border-primary/30 bg-[var(--bg-raised)] px-3 py-1.5">
                                <span className="text-[12px] font-bold" style={{ fontFamily: 'var(--font-body)' }}>{q.numericAnswer}</span>
                                {q.numericUnit && <span className="text-[10px] text-muted-foreground">{q.numericUnit}</span>}
                            </div>
                            {q.numericTolerance !== undefined && q.numericTolerance > 0 && (
                                <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{'\u00B1'}{q.numericTolerance}</span>
                            )}
                        </div>
                    )}
                    {q.choiceGroup && (
                        <div className="mt-2 rounded border border-[var(--warning)]/30 bg-[var(--warning)]/5 px-3 py-1.5">
                            <span className="text-[10px] font-bold text-[var(--warning)]" style={{ fontFamily: 'var(--font-body)' }}>
                                Answer {q.choiceGroup.required.join(', ')} (required) + choose {q.choiceGroup.chooseN} from {q.choiceGroup.optional.join(', ')}
                            </span>
                        </div>
                    )}
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
