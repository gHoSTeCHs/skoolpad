'use no memo';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Plus, X } from 'lucide-react';
import type { EnumOption, MultiSelectMcqConfig, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

interface MultiChoiceAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
}

function defaultConfig(): MultiSelectMcqConfig {
    return {
        options: [
            { label: 'A', text: '', is_correct: false },
            { label: 'B', text: '', is_correct: false },
        ],
    };
}

export function MultiChoiceAuthor({ question, enumOptions }: MultiChoiceAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question);
    const config = (form.data.response_config as MultiSelectMcqConfig | null) ?? defaultConfig();
    const [editingIdx, setEditingIdx] = useState<number | null>(null);

    const setConfig = useCallback((next: MultiSelectMcqConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    function toggleCorrect(idx: number) {
        setConfig({
            ...config,
            options: config.options.map((o, i) => (i === idx ? { ...o, is_correct: !o.is_correct } : o)),
        });
    }

    function updateText(idx: number, text: string) {
        setConfig({
            ...config,
            options: config.options.map((o, i) => (i === idx ? { ...o, text } : o)),
        });
    }

    function addOption() {
        if (config.options.length >= MAX_OPTIONS) return;
        const label = OPTION_LABELS[config.options.length];
        setConfig({
            ...config,
            options: [...config.options, { label, text: '', is_correct: false }],
        });
        setEditingIdx(config.options.length);
    }

    function removeOption(idx: number) {
        if (config.options.length <= MIN_OPTIONS) return;
        const filtered = config.options
            .filter((_, i) => i !== idx)
            .map((o, i) => ({ ...o, label: OPTION_LABELS[i] }));
        setConfig({ ...config, options: filtered });
    }

    const correctCount = config.options.filter((o) => o.is_correct).length;
    const totalCount = config.options.length;

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Stem"
                description="Multi-select question. Click each row to toggle correct."
                placeholder="Type the multi-select prompt…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Options</span>
                        <span className="rounded-full bg-[var(--bg-raised)] px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {correctCount} of {totalCount} correct
                        </span>
                    </CardTitle>
                    <CardDescription>Click each row to toggle. Multiple correct answers allowed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1.5">
                        {config.options.map((option, idx) => {
                            const isEditing = editingIdx === idx;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => !isEditing && toggleCorrect(idx)}
                                    className={
                                        'group relative flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition-colors '
                                        + (option.is_correct
                                            ? 'border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)]'
                                            : 'border-border hover:border-[var(--fg-subtle)]')
                                    }
                                >
                                    <span
                                        className={
                                            'inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold '
                                            + (option.is_correct
                                                ? 'bg-[var(--opt-correct-dot)] text-white'
                                                : 'bg-[var(--bg-raised)] text-muted-foreground')
                                        }
                                    >
                                        {option.is_correct ? '✓' : '☐'}
                                    </span>

                                    <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                                        {OPTION_LABELS[idx]}
                                    </span>

                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => updateText(idx, e.target.value)}
                                            onBlur={() => setEditingIdx(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setEditingIdx(null);
                                                    if (idx === config.options.length - 1 && config.options.length < MAX_OPTIONS) {
                                                        addOption();
                                                    }
                                                } else if (e.key === 'Escape') {
                                                    setEditingIdx(null);
                                                }
                                            }}
                                            placeholder={`Option ${OPTION_LABELS[idx]}`}
                                            className="flex-1 border-0 bg-transparent text-[13px] outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className={'flex-1 ' + (option.text ? '' : 'italic text-muted-foreground')}>
                                            {option.text || `Option ${OPTION_LABELS[idx]}`}
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingIdx(idx);
                                        }}
                                        className="ml-2 size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-muted-foreground group-hover:opacity-100"
                                        aria-label={`Edit option ${OPTION_LABELS[idx]}`}
                                    >
                                        <Pencil className="mx-auto size-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        disabled={config.options.length <= MIN_OPTIONS}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOption(idx);
                                        }}
                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-destructive disabled:cursor-not-allowed disabled:hover:text-[var(--fg-subtle)] group-hover:opacity-100"
                                        aria-label={`Remove option ${OPTION_LABELS[idx]}`}
                                    >
                                        <X className="mx-auto size-3.5" />
                                    </button>
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={addOption}
                            disabled={config.options.length >= MAX_OPTIONS}
                            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-transparent px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="size-3.5" />
                            Add option
                        </button>
                    </div>
                </CardContent>
            </Card>

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
