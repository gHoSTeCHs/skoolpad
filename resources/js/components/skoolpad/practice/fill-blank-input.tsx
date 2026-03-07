import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import type { FillBlankConfig } from '@/types/questions';

interface FillBlankInputProps {
    responseConfig: FillBlankConfig;
    onSubmit: (data: { blanks: Record<string, string> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { blanks?: { position: number; correct_answers: string[] }[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { blanks: Record<string, string> } | null;
    questionContent?: string;
}

const BLANK_PATTERN = /_{3,}|\{\{blank\}\}|\{\{(\d+)\}\}/g;

function stripHtmlTags(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent ?? div.innerText ?? '';
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

export function FillBlankInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer, questionContent }: FillBlankInputProps) {
    const sortedBlanks = [...(responseConfig?.blanks ?? [])].sort((a, b) => a.position - b.position);
    const [answers, setAnswers] = useState<Record<string, string>>(() => existingAnswer?.blanks ?? {});
    const isSubmitted = !!feedback || !!readOnly;

    const canSubmit = !isSubmitted && sortedBlanks.every((b) => (answers[String(b.position)] ?? '').trim() !== '');

    const segments = useMemo(() => {
        const plainText = extractPlainText(questionContent);
        if (!plainText) return null;

        const matches = [...plainText.matchAll(BLANK_PATTERN)];
        if (matches.length === 0) return null;

        const parts: { type: 'text' | 'blank'; value: string; blankIndex: number }[] = [];
        let lastIndex = 0;

        matches.forEach((match, i) => {
            if (match.index! > lastIndex) {
                parts.push({ type: 'text', value: plainText.slice(lastIndex, match.index!), blankIndex: -1 });
            }
            parts.push({ type: 'blank', value: '', blankIndex: i });
            lastIndex = match.index! + match[0].length;
        });

        if (lastIndex < plainText.length) {
            parts.push({ type: 'text', value: plainText.slice(lastIndex), blankIndex: -1 });
        }

        return parts;
    }, [questionContent]);

    function handleChange(position: number, value: string) {
        if (isSubmitted) return;
        setAnswers((prev) => ({ ...prev, [String(position)]: value }));
    }

    function handleSubmit() {
        if (!canSubmit) return;
        onSubmit({ blanks: answers });
    }

    function isBlankCorrect(position: number): boolean {
        const correctBlanks = feedback?.correctAnswer?.blanks ?? [];
        const blank = correctBlanks.find((b) => b.position === position);
        if (!blank) return false;
        const studentAnswer = (existingAnswer?.blanks ?? answers)[String(position)] ?? '';
        const caseSensitive = responseConfig?.case_sensitive ?? false;
        return blank.correct_answers.some((a) =>
            caseSensitive ? studentAnswer === a : studentAnswer.toLowerCase().trim() === a.toLowerCase().trim(),
        );
    }

    function getCorrectAnswer(position: number): string {
        const correctBlanks = feedback?.correctAnswer?.blanks ?? [];
        const blank = correctBlanks.find((b) => b.position === position);
        return blank?.correct_answers[0] ?? '';
    }

    function getInputStyle(position: number): string {
        if (!isSubmitted) {
            return 'border-b-2 border-primary/40 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none';
        }
        if (isBlankCorrect(position)) {
            return 'border-b-2 border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400';
        }
        return 'border-b-2 border-destructive bg-destructive/5 text-destructive';
    }

    function getFallbackInputStyle(position: number): string {
        if (!isSubmitted) {
            return 'border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';
        }
        if (isBlankCorrect(position)) {
            return 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 reader:text-emerald-400 focus:outline-none';
        }
        return 'border-destructive bg-destructive/5 text-destructive focus:outline-none';
    }

    if (segments && segments.some((s) => s.type === 'blank')) {
        return (
            <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-y-3 text-sm leading-loose" style={{ fontFamily: 'var(--font-content)' }}>
                    {segments.map((seg, i) => {
                        if (seg.type === 'text') {
                            return <span key={i}>{seg.value}</span>;
                        }

                        const blank = sortedBlanks[seg.blankIndex];
                        if (!blank) return null;
                        const pos = blank.position;

                        return (
                            <span key={i} className="inline-flex flex-col mx-0.5">
                                <input
                                    type="text"
                                    value={(isSubmitted ? (existingAnswer?.blanks ?? answers) : answers)[String(pos)] ?? ''}
                                    onChange={(e) => handleChange(pos, e.target.value)}
                                    disabled={isSubmitted}
                                    className={cn(
                                        'inline-block w-32 px-1 py-0.5 text-sm text-center disabled:opacity-60',
                                        getInputStyle(pos),
                                    )}
                                    placeholder={`blank ${seg.blankIndex + 1}`}
                                    style={{ fontFamily: 'var(--font-content)' }}
                                />
                                {isSubmitted && !isBlankCorrect(pos) && getCorrectAnswer(pos) && (
                                    <span className="text-[10px] text-muted-foreground text-center" style={{ fontFamily: 'var(--font-body)' }}>
                                        {getCorrectAnswer(pos)}
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
            {sortedBlanks.map((blank, i) => (
                <div key={blank.position} className="flex items-start gap-3">
                    <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {i + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                        <input
                            type="text"
                            value={(isSubmitted ? (existingAnswer?.blanks ?? answers) : answers)[String(blank.position)] ?? ''}
                            onChange={(e) => handleChange(blank.position, e.target.value)}
                            disabled={isSubmitted}
                            className={cn('w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60', getFallbackInputStyle(blank.position))}
                            placeholder={`Enter answer ${i + 1}`}
                            style={{ fontFamily: 'var(--font-content)' }}
                        />
                        {isSubmitted && !isBlankCorrect(blank.position) && getCorrectAnswer(blank.position) && (
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                                Correct:{' '}
                                <span className="font-semibold text-foreground">{getCorrectAnswer(blank.position)}</span>
                            </p>
                        )}
                    </div>
                </div>
            ))}

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
