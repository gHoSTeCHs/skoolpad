'use no memo';

import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { EnumOption, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

interface RubricCriterion {
    label: string;
    text: string;
    points: number;
}

interface FreeFormConfig {
    minWords?: number;
    maxWords?: number;
    rubric?: RubricCriterion[];
}

interface FreeFormAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
}

const CRITERION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function FreeFormAuthor({ question, enumOptions }: FreeFormAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question);
    const config = (form.data.response_config as FreeFormConfig | null) ?? {};
    const rubric = config.rubric ?? [];

    const setConfig = useCallback((next: FreeFormConfig) => {
        const cleaned: FreeFormConfig = {};
        if (typeof next.minWords === 'number' && Number.isFinite(next.minWords)) cleaned.minWords = next.minWords;
        if (typeof next.maxWords === 'number' && Number.isFinite(next.maxWords)) cleaned.maxWords = next.maxWords;
        if (next.rubric && next.rubric.length > 0) cleaned.rubric = next.rubric;
        const isEmpty = Object.keys(cleaned).length === 0;
        form.setData('response_config', isEmpty ? null : (cleaned as never));
    }, [form]);

    function addCriterion() {
        const next = [...rubric, {
            label: CRITERION_LABELS[rubric.length] ?? `${rubric.length + 1}`,
            text: '',
            points: 0,
        }];
        setConfig({ ...config, rubric: next });
    }

    function updateCriterion(idx: number, patch: Partial<RubricCriterion>) {
        const next = rubric.map((c, i) => (i === idx ? { ...c, ...patch } : c));
        setConfig({ ...config, rubric: next });
    }

    function removeCriterion(idx: number) {
        const next = rubric
            .filter((_, i) => i !== idx)
            .map((c, i) => ({ ...c, label: CRITERION_LABELS[i] ?? `${i + 1}` }));
        setConfig({ ...config, rubric: next });
    }

    const typeLabel = question.question_type === 'theory'
        ? 'Theory'
        : question.question_type === 'short_answer'
            ? 'Short answer'
            : 'Essay';

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title={`${typeLabel} stem`}
                description="The question prompt as the student will read it. Use the editor for math, code, tables, and images."
                placeholder={`Write the ${typeLabel.toLowerCase()} prompt here…`}
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Word range</CardTitle>
                    <CardDescription>
                        Optional. When set, the student sees a soft hint above the editor; submissions outside the range can still be graded.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Min words" name="min_words">
                            <Input
                                id="min_words"
                                type="number"
                                min={0}
                                step={10}
                                value={config.minWords ?? ''}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setConfig({ ...config, minWords: v === '' ? undefined : Number(v) });
                                }}
                                placeholder="—"
                            />
                        </FormField>
                        <FormField label="Max words" name="max_words">
                            <Input
                                id="max_words"
                                type="number"
                                min={0}
                                step={10}
                                value={config.maxWords ?? ''}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setConfig({ ...config, maxWords: v === '' ? undefined : Number(v) });
                                }}
                                placeholder="—"
                            />
                        </FormField>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Rubric</CardTitle>
                    <CardDescription>
                        Optional. Adding a rubric unlocks AI-assisted grading. Without a rubric, free-form questions
                        fall back to fully manual grading.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {rubric.map((criterion, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-[28px_1fr_72px_32px] items-center gap-3 rounded-md border border-dashed border-border bg-card px-3 py-2"
                            >
                                <span className="rounded bg-primary px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold text-primary-foreground">
                                    {criterion.label}
                                </span>
                                <Input
                                    value={criterion.text}
                                    onChange={(e) => updateCriterion(idx, { text: e.target.value })}
                                    placeholder="Criterion description"
                                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={criterion.points}
                                    onChange={(e) => updateCriterion(idx, { points: Number(e.target.value) || 0 })}
                                    className="text-right font-mono text-xs"
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeCriterion(idx)}
                                    className="size-8 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="size-4" />
                                    <span className="sr-only">Remove criterion {criterion.label}</span>
                                </Button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addCriterion}
                            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                        >
                            <Plus className="size-3.5" />
                            Add criterion
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
