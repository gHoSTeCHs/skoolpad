'use no memo';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, X } from 'lucide-react';
import type { EnumOption, OrderingConfig, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

interface OrderingAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

function defaultConfig(): OrderingConfig {
    return {
        items: [''],
        correct_order: [0],
    };
}

export function OrderingAuthor({ question, enumOptions, onDirtyChange }: OrderingAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question, onDirtyChange);
    const config = (form.data.response_config as OrderingConfig | null) ?? defaultConfig();
    const [editingIdx, setEditingIdx] = useState<number | null>(null);

    const setConfig = useCallback((next: OrderingConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    function updateText(idx: number, text: string) {
        const items = config.items.map((it, i) => (i === idx ? text : it));
        setConfig({ ...config, items });
    }

    function addItem() {
        const items = [...config.items, ''];
        const correct_order = [...config.correct_order, items.length - 1];
        setConfig({ items, correct_order });
        setEditingIdx(items.length - 1);
    }

    function removeItem(idx: number) {
        if (config.items.length <= 1) return;
        const items = config.items.filter((_, i) => i !== idx);
        const correct_order = items.map((_, i) => i);
        setConfig({ items, correct_order });
    }

    function move(idx: number, dir: -1 | 1) {
        const target = idx + dir;
        if (target < 0 || target >= config.items.length) return;
        const items = [...config.items];
        [items[idx], items[target]] = [items[target], items[idx]];
        setConfig({ ...config, items });
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Ordering prompt"
                description="The student receives the items shuffled and must reorder them. Author the correct order top-to-bottom."
                placeholder="Type the ordering prompt…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Correct order (top → bottom)</CardTitle>
                    <CardDescription>
                        Use the up/down buttons to reorder. Position numbers update live. Partial credit awarded per correctly-positioned item.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1.5">
                        {config.items.map((item, idx) => {
                            const isEditing = editingIdx === idx;
                            return (
                                <div
                                    key={idx}
                                    className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px]"
                                >
                                    <GripVertical className="size-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-bold text-primary">
                                        {idx + 1}
                                    </span>

                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateText(idx, e.target.value)}
                                            onBlur={() => setEditingIdx(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setEditingIdx(null);
                                                    if (idx === config.items.length - 1) addItem();
                                                } else if (e.key === 'Escape') {
                                                    setEditingIdx(null);
                                                }
                                            }}
                                            placeholder="Step…"
                                            className="flex-1 border-0 bg-transparent text-[13px] outline-none"
                                        />
                                    ) : (
                                        <span
                                            onClick={() => setEditingIdx(idx)}
                                            className={'flex-1 cursor-text ' + (item ? '' : 'italic text-muted-foreground')}
                                        >
                                            {item || 'Step…'}
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => move(idx, -1)}
                                        disabled={idx === 0}
                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 group-hover:opacity-100"
                                        aria-label="Move up"
                                    >
                                        <ArrowUp className="mx-auto size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(idx, 1)}
                                        disabled={idx === config.items.length - 1}
                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 group-hover:opacity-100"
                                        aria-label="Move down"
                                    >
                                        <ArrowDown className="mx-auto size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingIdx(idx)}
                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-muted-foreground group-hover:opacity-100"
                                        aria-label="Edit step"
                                    >
                                        <Pencil className="mx-auto size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        disabled={config.items.length <= 1}
                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-destructive disabled:cursor-not-allowed group-hover:opacity-100"
                                        aria-label="Remove step"
                                    >
                                        <X className="mx-auto size-3.5" />
                                    </button>
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={addItem}
                            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-transparent px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                        >
                            <Plus className="size-3.5" />
                            Add step
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
