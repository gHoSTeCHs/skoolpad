'use no memo';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, GripVertical, Pencil, Plus, X } from 'lucide-react';
import type { EnumOption, MatchingConfig, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';
import { AcceptChips } from './_shared/accept-chips';

interface MatchingAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
}

const MIN_PAIRS = 2;

function defaultConfig(): MatchingConfig {
    return {
        pairs: [
            { left: '', right: '' },
            { left: '', right: '' },
        ],
        distractors: [],
    };
}

export function MatchingAuthor({ question, enumOptions }: MatchingAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question);
    const config = (form.data.response_config as MatchingConfig | null) ?? defaultConfig();
    const [editingIdx, setEditingIdx] = useState<{ row: number; side: 'left' | 'right' } | null>(null);

    const setConfig = useCallback((next: MatchingConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    function updatePair(idx: number, patch: Partial<{ left: string; right: string }>) {
        const pairs = config.pairs.map((p, i) => (i === idx ? { ...p, ...patch } : p));
        setConfig({ ...config, pairs });
    }

    function commitAndAdvance(idx: number, side: 'left' | 'right', text: string) {
        form.setData((prev) => {
            const current = (prev.response_config as MatchingConfig | null) ?? defaultConfig();
            const updatedPairs = current.pairs.map((p, i) =>
                i === idx ? { ...p, [side]: text } : p,
            );
            const isLastRowRight = side === 'right' && idx === current.pairs.length - 1;
            const finalPairs = isLastRowRight
                ? [...updatedPairs, { left: '', right: '' }]
                : updatedPairs;
            return { ...prev, response_config: { ...current, pairs: finalPairs } as never };
        });
        const isLastRowRight = side === 'right' && idx === config.pairs.length - 1;
        if (isLastRowRight) {
            setEditingIdx({ row: idx + 1, side: 'left' });
        } else if (side === 'left') {
            setEditingIdx({ row: idx, side: 'right' });
        } else {
            setEditingIdx({ row: idx + 1, side: 'left' });
        }
    }

    function addPair() {
        setConfig({ ...config, pairs: [...config.pairs, { left: '', right: '' }] });
        setEditingIdx({ row: config.pairs.length, side: 'left' });
    }

    function removePair(idx: number) {
        if (config.pairs.length <= MIN_PAIRS) return;
        setConfig({ ...config, pairs: config.pairs.filter((_, i) => i !== idx) });
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Matching prompt"
                description="Author the correct pairings. Right column auto-shuffles for the student."
                placeholder="Type the matching prompt…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Pairs</CardTitle>
                    <CardDescription>Each row is a correct pairing. Click any cell to edit.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1.5">
                        {config.pairs.map((pair, idx) => (
                            <div
                                key={idx}
                                className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                            >
                                <GripVertical className="size-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden />

                                <PairCell
                                    isEditing={editingIdx?.row === idx && editingIdx.side === 'left'}
                                    value={pair.left}
                                    placeholder="Left item"
                                    onActivate={() => setEditingIdx({ row: idx, side: 'left' })}
                                    onCommit={(text) => {
                                        updatePair(idx, { left: text });
                                        setEditingIdx(null);
                                    }}
                                    onCancel={() => setEditingIdx(null)}
                                    onAdvance={(text) => commitAndAdvance(idx, 'left', text)}
                                />

                                <ArrowLeftRight className="size-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden />

                                <PairCell
                                    isEditing={editingIdx?.row === idx && editingIdx.side === 'right'}
                                    value={pair.right}
                                    placeholder="Right answer"
                                    onActivate={() => setEditingIdx({ row: idx, side: 'right' })}
                                    onCommit={(text) => {
                                        updatePair(idx, { right: text });
                                        setEditingIdx(null);
                                    }}
                                    onCancel={() => setEditingIdx(null)}
                                    onAdvance={(text) => commitAndAdvance(idx, 'right', text)}
                                />

                                <button
                                    type="button"
                                    onClick={() => setEditingIdx({ row: idx, side: 'left' })}
                                    className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-muted-foreground group-hover:opacity-100"
                                    aria-label="Edit pair"
                                >
                                    <Pencil className="mx-auto size-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removePair(idx)}
                                    disabled={config.pairs.length <= MIN_PAIRS}
                                    className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-destructive disabled:cursor-not-allowed group-hover:opacity-100"
                                    aria-label="Remove pair"
                                >
                                    <X className="mx-auto size-3.5" />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addPair}
                            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border bg-transparent px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                        >
                            <Plus className="size-3.5" />
                            Add pair
                        </button>
                    </div>

                    <div className="mt-5 space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Distractors
                            </span>
                            <span className="text-[10px] text-[var(--fg-subtle)]">
                                — right-column noise · don't pair with anything · raise difficulty
                            </span>
                        </div>
                        <AcceptChips
                            values={config.distractors ?? []}
                            onChange={(values) => setConfig({ ...config, distractors: values })}
                            addLabel="+ add distractor"
                            placeholder="distractor"
                        />
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

interface PairCellProps {
    isEditing: boolean;
    value: string;
    placeholder: string;
    onActivate: () => void;
    onCommit: (text: string) => void;
    onCancel: () => void;
    onAdvance: (text: string) => void;
}

function PairCell({ isEditing, value, placeholder, onActivate, onCommit, onCancel, onAdvance }: PairCellProps) {
    const [draft, setDraft] = useState(value);

    if (!isEditing) {
        return (
            <span
                onClick={onActivate}
                className={'flex-1 cursor-text rounded border border-border bg-[var(--bg-raised)] px-2 py-1 text-[12.5px] ' + (value ? '' : 'italic text-muted-foreground')}
            >
                {value || placeholder}
            </span>
        );
    }

    return (
        <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onCommit(draft)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onAdvance(draft);
                } else if (e.key === 'Escape') {
                    onCancel();
                }
            }}
            placeholder={placeholder}
            className="flex-1 rounded border border-[var(--fg-subtle)] bg-card px-2 py-1 text-[12.5px] outline-none"
        />
    );
}
