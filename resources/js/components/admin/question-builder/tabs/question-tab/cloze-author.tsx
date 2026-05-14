'use no memo';

import { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, X } from 'lucide-react';
import type { ClozeConfig, EnumOption, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

interface ClozeAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

const GAP_RE = /\[\[([^\]]*)\]\]/g;

interface ParsedGap {
    position: number;
    captured: string;
}

function parseGaps(stem: string): ParsedGap[] {
    return Array.from(stem.matchAll(GAP_RE)).map((m, i) => ({
        position: i + 1,
        captured: (m[1] ?? '').trim(),
    }));
}

function defaultConfig(): ClozeConfig {
    return { gaps: [] };
}

export function ClozeAuthor({ question, enumOptions, onDirtyChange }: ClozeAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question, onDirtyChange);
    const config = (form.data.response_config as ClozeConfig | null) ?? defaultConfig();
    const stem = form.data.content ?? '';
    const parsed = useMemo(() => parseGaps(stem), [stem]);
    const [editingGap, setEditingGap] = useState<{ gap: number; option: number } | null>(null);

    const setConfig = useCallback((next: ClozeConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    const gaps = useMemo(() => {
        const existing = config.gaps ?? [];
        return parsed.map((p) => {
            const match = existing.find((g) => g.position === p.position);
            if (match && match.options.length >= 2) return match;
            const seedOptions = p.captured ? [p.captured, ''] : ['', ''];
            return match ?? { position: p.position, options: seedOptions, correct: 0 };
        });
    }, [parsed, config.gaps]);

    function setGap(position: number, patch: Partial<ClozeConfig['gaps'][number]>) {
        const others = gaps.filter((g) => g.position !== position);
        const target = gaps.find((g) => g.position === position);
        if (!target) return;
        const updated = [...others, { ...target, ...patch }]
            .filter((g) => g.options.length >= 2)
            .sort((a, b) => a.position - b.position);
        setConfig({ gaps: updated });
    }

    function addOption(position: number) {
        const target = gaps.find((g) => g.position === position);
        if (!target) return;
        setGap(position, { options: [...target.options, ''] });
    }

    function removeOption(position: number, optionIdx: number) {
        const target = gaps.find((g) => g.position === position);
        if (!target || target.options.length <= 2) return;
        const options = target.options.filter((_, i) => i !== optionIdx);
        const correct = optionIdx === target.correct
            ? 0
            : optionIdx < target.correct ? target.correct - 1 : target.correct;
        setGap(position, { options, correct });
    }

    function updateOption(position: number, optionIdx: number, text: string) {
        const target = gaps.find((g) => g.position === position);
        if (!target) return;
        const options = target.options.map((o, i) => (i === optionIdx ? text : o));
        setGap(position, { options });
    }

    function setCorrect(position: number, optionIdx: number) {
        setGap(position, { correct: optionIdx });
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>Cloze stem with gaps</CardTitle>
                    <CardDescription>
                        Wrap any gap target with <code className="rounded bg-[var(--bg-raised)] px-1 py-0.5 font-mono text-[11px]">[[double brackets]]</code>.
                        Each pair auto-creates a multiple-choice gap below. Cloze differs from fill-blank: each gap shows the student a list of options to pick from.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <textarea
                        rows={4}
                        value={stem}
                        onChange={(e) => form.setData((prev) => ({ ...prev, content: e.target.value, content_doc: null }))}
                        placeholder='e.g. "The MMU translates a [[virtual address]] into a [[physical address]]…"'
                        className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 font-mono text-[13px] outline-none focus:border-[var(--fg-subtle)]"
                    />
                </CardContent>
            </Card>

            {parsed.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Options per gap</CardTitle>
                        <CardDescription>Each gap needs at least 2 options. Click an option to mark it correct.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {gaps.map((gap) => (
                                <div key={gap.position} className="rounded-md border border-border bg-card px-3 py-3">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="rounded-full bg-[var(--badge-primary-fg)] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                                            {gap.position}
                                        </span>
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                            Gap options · click to mark correct
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {gap.options.map((option, idx) => {
                                            const isEditing = editingGap?.gap === gap.position && editingGap.option === idx;
                                            const isCorrect = gap.correct === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => !isEditing && setCorrect(gap.position, idx)}
                                                    className={
                                                        'group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors '
                                                        + (isCorrect
                                                            ? 'border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)]'
                                                            : 'border-border hover:border-[var(--fg-subtle)]')
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            'inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold '
                                                            + (isCorrect
                                                                ? 'bg-[var(--opt-correct-dot)] text-white'
                                                                : 'bg-[var(--bg-raised)] text-muted-foreground')
                                                        }
                                                    >
                                                        {isCorrect ? '✓' : idx + 1}
                                                    </span>
                                                    {isEditing ? (
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => updateOption(gap.position, idx, e.target.value)}
                                                            onBlur={() => setEditingGap(null)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === 'Escape') {
                                                                    e.preventDefault();
                                                                    setEditingGap(null);
                                                                }
                                                            }}
                                                            placeholder="Option text"
                                                            className="flex-1 border-0 bg-transparent text-[12.5px] outline-none"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingGap({ gap: gap.position, option: idx });
                                                            }}
                                                            className={'flex-1 cursor-text ' + (option ? '' : 'italic text-muted-foreground')}
                                                        >
                                                            {option || 'Option text…'}
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeOption(gap.position, idx);
                                                        }}
                                                        disabled={gap.options.length <= 2}
                                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-destructive disabled:cursor-not-allowed group-hover:opacity-100"
                                                        aria-label="Remove option"
                                                    >
                                                        <X className="mx-auto size-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => addOption(gap.position)}
                                            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-transparent px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                                        >
                                            <Plus className="size-3.5" />
                                            Add option to gap {gap.position}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <MetadataCard
                marks={form.data.marks}
                difficulty={form.data.difficulty_level}
                bloom={form.data.bloom_level}
                enumOptions={enumOptions}
                errors={{
                    marks: form.errors.marks,
                    difficulty_level: form.errors.difficulty_level,
                    bloom_level: form.errors.bloom_level,
                }}
                onMarksChange={(m) => form.setData('marks', m)}
                onDifficultyChange={(d) => form.setData('difficulty_level', d)}
                onBloomChange={(b) => form.setData('bloom_level', b)}
            />

            <SaveBar isDirty={isDirty} processing={form.processing} recentlySuccessful={form.recentlySuccessful} />
        </form>
    );
}
