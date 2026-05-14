'use no memo';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Plus, X } from 'lucide-react';
import type { EnumOption, MatrixMatchingConfig, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

const COLUMN_LABELS = ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];
const MIN_LEFT = 2;
const MIN_RIGHT = 2;

interface MatrixAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
}

function defaultConfig(): MatrixMatchingConfig {
    return {
        left: ['1.', '2.'],
        right: ['', ''],
        mapping: { 0: [], 1: [] },
    };
}

export function MatrixMatchingAuthor({ question, enumOptions }: MatrixAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question);
    const config = (form.data.response_config as MatrixMatchingConfig | null) ?? defaultConfig();
    const [editingLeft, setEditingLeft] = useState<number | null>(null);
    const [editingRight, setEditingRight] = useState<number | null>(null);

    const setConfig = useCallback((next: MatrixMatchingConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    function toggleCell(rowIdx: number, colIdx: number) {
        const current = config.mapping[rowIdx] ?? [];
        const next = current.includes(colIdx) ? current.filter((c) => c !== colIdx) : [...current, colIdx];
        setConfig({ ...config, mapping: { ...config.mapping, [rowIdx]: next } });
    }

    function addRow() {
        const left = [...config.left, `${config.left.length + 1}.`];
        setConfig({
            ...config,
            left,
            mapping: { ...config.mapping, [left.length - 1]: [] },
        });
        setEditingLeft(left.length - 1);
    }

    function removeRow(idx: number) {
        if (config.left.length <= MIN_LEFT) return;
        const left = config.left.filter((_, i) => i !== idx);
        const mapping: Record<number, number[]> = {};
        let target = 0;
        config.left.forEach((_, i) => {
            if (i === idx) return;
            mapping[target++] = config.mapping[i] ?? [];
        });
        setConfig({ ...config, left, mapping });
    }

    function updateLeft(idx: number, text: string) {
        setConfig({ ...config, left: config.left.map((v, i) => (i === idx ? text : v)) });
    }

    function addColumn() {
        if (config.right.length >= COLUMN_LABELS.length) return;
        setConfig({ ...config, right: [...config.right, ''] });
        setEditingRight(config.right.length);
    }

    function removeColumn(idx: number) {
        if (config.right.length <= MIN_RIGHT) return;
        const right = config.right.filter((_, i) => i !== idx);
        const mapping: Record<number, number[]> = {};
        Object.entries(config.mapping).forEach(([rowKey, cols]) => {
            mapping[Number(rowKey)] = cols
                .filter((c) => c !== idx)
                .map((c) => (c > idx ? c - 1 : c));
        });
        setConfig({ ...config, right, mapping });
    }

    function updateRight(idx: number, text: string) {
        setConfig({ ...config, right: config.right.map((v, i) => (i === idx ? text : v)) });
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Matrix prompt"
                description="A grid where each Column-I row can map to one or more Column-II items. Click any cell to toggle correct."
                placeholder="Type the matrix-matching prompt…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Matrix</CardTitle>
                    <CardDescription>
                        Click cells to toggle correct mappings. A single Column-I item can map to multiple Column-II items.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[12.5px]">
                            <thead>
                                <tr>
                                    <th className="border-b border-border px-2 py-2 text-left font-display text-[12px] font-semibold">
                                        Column I
                                    </th>
                                    {config.right.map((_, colIdx) => (
                                        <th
                                            key={colIdx}
                                            className="border-b border-border px-2 py-2 text-center font-mono text-[11px] font-semibold text-muted-foreground"
                                        >
                                            <div className="group inline-flex items-center gap-1">
                                                {COLUMN_LABELS[colIdx]}
                                                <button
                                                    type="button"
                                                    onClick={() => removeColumn(colIdx)}
                                                    disabled={config.right.length <= MIN_RIGHT}
                                                    className="opacity-0 transition-opacity hover:text-destructive disabled:cursor-not-allowed group-hover:opacity-100"
                                                    aria-label={`Remove column ${COLUMN_LABELS[colIdx]}`}
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {config.left.map((label, rowIdx) => (
                                    <tr key={rowIdx} className="group">
                                        <td className="border-b border-[var(--border-2)] px-2 py-2">
                                            {editingLeft === rowIdx ? (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={label}
                                                    onChange={(e) => updateLeft(rowIdx, e.target.value)}
                                                    onBlur={() => setEditingLeft(null)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') {
                                                            e.preventDefault();
                                                            setEditingLeft(null);
                                                        }
                                                    }}
                                                    className="w-full border-0 bg-transparent text-[12.5px] outline-none"
                                                />
                                            ) : (
                                                <span
                                                    onClick={() => setEditingLeft(rowIdx)}
                                                    className={'cursor-text ' + (label ? '' : 'italic text-muted-foreground')}
                                                >
                                                    {label || 'Row…'}
                                                </span>
                                            )}
                                        </td>
                                        {config.right.map((_, colIdx) => {
                                            const isMapped = (config.mapping[rowIdx] ?? []).includes(colIdx);
                                            return (
                                                <td
                                                    key={colIdx}
                                                    onClick={() => toggleCell(rowIdx, colIdx)}
                                                    className={
                                                        'cursor-pointer border-b border-[var(--border-2)] px-2 py-2 text-center font-mono transition-colors '
                                                        + (isMapped
                                                            ? 'bg-[var(--opt-correct-bg)] text-[var(--opt-correct-dot)]'
                                                            : 'hover:bg-[var(--bg-raised)] text-[var(--fg-subtle)]')
                                                    }
                                                >
                                                    {isMapped ? '✓' : '–'}
                                                </td>
                                            );
                                        })}
                                        <td className="border-b border-[var(--border-2)] px-1">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(rowIdx)}
                                                disabled={config.left.length <= MIN_LEFT}
                                                className="size-6 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-destructive disabled:cursor-not-allowed group-hover:opacity-100"
                                                aria-label={`Remove row ${rowIdx + 1}`}
                                            >
                                                <X className="mx-auto size-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-transparent px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                        >
                            <Plus className="size-3" />
                            Add Column-I row
                        </button>
                        <button
                            type="button"
                            onClick={addColumn}
                            disabled={config.right.length >= COLUMN_LABELS.length}
                            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-transparent px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="size-3" />
                            Add Column-II item
                        </button>
                    </div>

                    <div className="mt-5 space-y-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Column II legend
                        </span>
                        <div className="space-y-1.5">
                            {config.right.map((text, idx) => (
                                <div key={idx} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px]">
                                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--bg-raised)] font-mono text-[11px] font-semibold text-muted-foreground">
                                        {COLUMN_LABELS[idx]}
                                    </span>
                                    {editingRight === idx ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={text}
                                            onChange={(e) => updateRight(idx, e.target.value)}
                                            onBlur={() => setEditingRight(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === 'Escape') {
                                                    e.preventDefault();
                                                    setEditingRight(null);
                                                }
                                            }}
                                            placeholder="Column-II item"
                                            className="flex-1 border-0 bg-transparent outline-none"
                                        />
                                    ) : (
                                        <span
                                            onClick={() => setEditingRight(idx)}
                                            className={'flex-1 cursor-text ' + (text ? '' : 'italic text-muted-foreground')}
                                        >
                                            {text || `Item ${COLUMN_LABELS[idx]}`}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setEditingRight(idx)}
                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-muted-foreground"
                                        aria-label={`Edit item ${COLUMN_LABELS[idx]}`}
                                    >
                                        <Pencil className="mx-auto size-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
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
