import DOMPurify from 'dompurify';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import type { ClozeConfig } from '@/types/questions';

interface ClozeInputProps {
    responseConfig: ClozeConfig;
    onSubmit: (data: { gaps: Record<string, number> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { gaps?: { position: number; options: string[]; correct: number }[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { gaps: Record<string, number> } | null;
    questionContent?: string;
}

const GAP_PATTERN = /_{3,}|\{\{gap\}\}|\{\{(\d+)\}\}|\[gap\]/g;

function stripHtmlTags(html: string): string {
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

function extractPlainText(content: string | undefined): string | null {
    if (!content) return null;

    try {
        const parsed = JSON.parse(content);
        if (parsed?.type === 'doc' && Array.isArray(parsed.content)) {
            const texts: string[] = [];
            function walk(node: Record<string, unknown>) {
                if (node.text && typeof node.text === 'string') {
                    texts.push(node.text);
                }
                if (Array.isArray(node.content)) {
                    (node.content as Record<string, unknown>[]).forEach(walk);
                }
            }
            walk(parsed);
            return texts.join('') || null;
        }
    } catch {
        /* not JSON */
    }

    if (/<\/?[a-z][\s\S]*?>/i.test(content)) {
        return stripHtmlTags(content);
    }

    return content;
}

export function ClozeInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer, questionContent }: ClozeInputProps) {
    const sortedGaps = [...(responseConfig?.gaps ?? [])].sort((a, b) => a.position - b.position);
    const [selections, setSelections] = useState<Record<string, number>>(() => existingAnswer?.gaps ?? {});
    const isSubmitted = !!feedback || !!readOnly;

    const canSubmit = !isSubmitted && sortedGaps.every((g) => (selections[String(g.position)] ?? -1) >= 0);

    const segments = useMemo(() => {
        const plainText = extractPlainText(questionContent);
        if (!plainText) return null;

        const matches = [...plainText.matchAll(GAP_PATTERN)];
        if (matches.length === 0) return null;

        const parts: { type: 'text' | 'gap'; value: string; gapIndex: number }[] = [];
        let lastIndex = 0;

        matches.forEach((match, i) => {
            if (match.index! > lastIndex) {
                parts.push({ type: 'text', value: plainText.slice(lastIndex, match.index!), gapIndex: -1 });
            }
            parts.push({ type: 'gap', value: '', gapIndex: i });
            lastIndex = match.index! + match[0].length;
        });

        if (lastIndex < plainText.length) {
            parts.push({ type: 'text', value: plainText.slice(lastIndex), gapIndex: -1 });
        }

        return parts;
    }, [questionContent]);

    function handleChange(position: number, index: number) {
        if (isSubmitted) return;
        setSelections((prev) => ({ ...prev, [String(position)]: index }));
    }

    function handleSubmit() {
        if (!canSubmit) return;
        onSubmit({ gaps: selections });
    }

    function getCorrectGap(position: number): { options: string[]; correct: number } | undefined {
        return (feedback?.correctAnswer?.gaps ?? []).find((g) => g.position === position);
    }

    function isGapCorrect(gap: { position: number; correct: number }): boolean {
        const selected = (existingAnswer?.gaps ?? selections)[String(gap.position)] ?? -1;
        const correctGap = getCorrectGap(gap.position);
        const correctIndex = correctGap !== undefined ? correctGap.correct : gap.correct;
        return selected === correctIndex;
    }

    function getInlineSelectStyle(gap: { position: number; correct: number }): string {
        if (!isSubmitted) {
            const selected = selections[String(gap.position)] ?? -1;
            return selected >= 0
                ? 'border-b-2 border-primary/60 bg-transparent text-foreground'
                : 'border-b-2 border-muted-foreground/40 bg-transparent text-foreground';
        }
        if (isGapCorrect(gap)) {
            return 'border-b-2 border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400';
        }
        return 'border-b-2 border-destructive bg-destructive/5 text-destructive';
    }

    function getFallbackSelectStyle(gap: { position: number; correct: number }): string {
        if (!isSubmitted) {
            const selected = selections[String(gap.position)] ?? -1;
            return selected >= 0
                ? 'border-primary/60 bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none'
                : 'border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';
        }
        if (isGapCorrect(gap)) {
            return 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400 focus:outline-none';
        }
        return 'border-destructive bg-destructive/5 text-destructive focus:outline-none';
    }

    if (segments && segments.some((s) => s.type === 'gap')) {
        return (
            <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-y-3 text-sm leading-loose" style={{ fontFamily: 'var(--font-content)' }}>
                    {segments.map((seg, i) => {
                        if (seg.type === 'text') {
                            return <span key={i}>{seg.value}</span>;
                        }

                        const gap = sortedGaps[seg.gapIndex];
                        if (!gap) return null;
                        const pos = gap.position;
                        const selectedIndex = (isSubmitted ? (existingAnswer?.gaps ?? selections) : selections)[String(pos)] ?? -1;
                        const correctGap = getCorrectGap(pos);
                        const correctIndex = correctGap !== undefined ? correctGap.correct : gap.correct;
                        const correctOptionText = gap.options[correctIndex] ?? '';

                        return (
                            <span key={i} className="inline-flex flex-col mx-0.5">
                                <select
                                    value={selectedIndex}
                                    onChange={(e) => handleChange(pos, Number(e.target.value))}
                                    disabled={isSubmitted}
                                    className={cn(
                                        'inline-block px-1 py-0.5 text-sm disabled:opacity-60 rounded-none appearance-none cursor-pointer',
                                        getInlineSelectStyle(gap),
                                    )}
                                    style={{ fontFamily: 'var(--font-content)' }}
                                >
                                    <option value={-1} disabled>
                                        [select]
                                    </option>
                                    {gap.options.map((opt, idx) => (
                                        <option key={idx} value={idx}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                                {isSubmitted && !isGapCorrect(gap) && correctOptionText && (
                                    <span className="text-[10px] text-muted-foreground text-center" style={{ fontFamily: 'var(--font-body)' }}>
                                        {correctOptionText}
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>

                {canSubmit && (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                    >
                        Submit Answer
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {sortedGaps.map((gap, i) => {
                const selectedIndex = (isSubmitted ? (existingAnswer?.gaps ?? selections) : selections)[String(gap.position)] ?? -1;
                const correctGap = getCorrectGap(gap.position);
                const correctIndex = correctGap !== undefined ? correctGap.correct : gap.correct;
                const correctOptionText = gap.options[correctIndex] ?? '';

                return (
                    <div key={gap.position} className="flex items-start gap-3">
                        <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {i + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                            <select
                                value={selectedIndex}
                                onChange={(e) => handleChange(gap.position, Number(e.target.value))}
                                disabled={isSubmitted}
                                className={cn(
                                    'w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60',
                                    getFallbackSelectStyle(gap),
                                )}
                                style={{ fontFamily: 'var(--font-content)' }}
                            >
                                <option value={-1} disabled>
                                    Select an option...
                                </option>
                                {gap.options.map((opt, idx) => (
                                    <option key={idx} value={idx}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            {isSubmitted && !isGapCorrect(gap) && correctOptionText && (
                                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                    Correct:{' '}
                                    <span className="font-semibold text-foreground">{correctOptionText}</span>
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}

            {canSubmit && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                >
                    Submit Answer
                </button>
            )}
        </div>
    );
}
