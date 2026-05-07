'use no memo';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { CalculationConfig, EnumOption, NumericEntryConfig, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

interface NumericAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

interface ExtendedConfig {
    answer: string | number;
    unit?: string;
    tolerance?: number;
    requires_working?: boolean;
    steps?: string[];
}

function defaultConfig(isCalculation: boolean): ExtendedConfig {
    return {
        answer: '',
        unit: '',
        tolerance: 0,
        ...(isCalculation ? { requires_working: false, steps: [''] } : {}),
    };
}

export function NumericAuthor({ question, enumOptions, onDirtyChange }: NumericAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question, onDirtyChange);
    const isCalculation = question.question_type === 'calculation';
    const config = (form.data.response_config as ExtendedConfig | null) ?? defaultConfig(isCalculation);
    const steps = config.steps ?? [];
    const [editingStepIdx, setEditingStepIdx] = useState<number | null>(null);

    const setConfig = useCallback((next: ExtendedConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    function setSteps(next: string[]) {
        setConfig({ ...config, steps: next });
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Stem"
                description={isCalculation
                    ? 'Calculation: tolerance + worked-steps block. Per-step part-marks are awarded automatically.'
                    : 'Numeric entry: a single value with optional unit + tolerance.'}
                placeholder="Type the numeric question…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Final answer</CardTitle>
                    <CardDescription>
                        Numeric value, unit (optional), and tolerance (absolute). Use 0 for exact-match grading.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-3 rounded-full border border-dashed border-[var(--fg-subtle)] bg-[var(--bg-raised)] px-5 py-2.5">
                            <input
                                type="text"
                                value={String(config.answer ?? '')}
                                onChange={(e) => setConfig({ ...config, answer: e.target.value })}
                                placeholder="value"
                                className="w-24 border-0 bg-transparent text-[18px] font-mono font-semibold text-foreground outline-none placeholder:italic placeholder:text-[var(--fg-subtle)]"
                            />
                            <input
                                type="text"
                                value={config.unit ?? ''}
                                onChange={(e) => setConfig({ ...config, unit: e.target.value })}
                                placeholder="unit"
                                className="w-20 border-0 bg-transparent text-[14px] font-mono text-muted-foreground outline-none placeholder:italic placeholder:text-[var(--fg-subtle)]"
                            />
                        </div>

                        <FormField label="Tolerance (±)" name="tolerance">
                            <Input
                                id="tolerance"
                                type="number"
                                min={0}
                                step={0.01}
                                value={config.tolerance ?? 0}
                                onChange={(e) => setConfig({ ...config, tolerance: Number(e.target.value) || 0 })}
                                className="w-32"
                            />
                        </FormField>
                    </div>
                </CardContent>
            </Card>

            {isCalculation && (
                <Card>
                    <CardHeader>
                        <CardTitle>Worked steps</CardTitle>
                        <CardDescription>
                            Each step shown to the student as part-marks awarded. Use formula chips ([[ ]]-style) to highlight key derivations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {steps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className="group flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2"
                                >
                                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 font-mono text-[11px] font-bold text-primary">
                                        {idx + 1}
                                    </span>
                                    {editingStepIdx === idx ? (
                                        <textarea
                                            autoFocus
                                            value={step}
                                            onChange={(e) => setSteps(steps.map((s, i) => (i === idx ? e.target.value : s)))}
                                            onBlur={() => setEditingStepIdx(null)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') setEditingStepIdx(null);
                                            }}
                                            rows={2}
                                            placeholder="Step…"
                                            className="flex-1 resize-none border-0 bg-transparent text-[13px] outline-none"
                                        />
                                    ) : (
                                        <span
                                            onClick={() => setEditingStepIdx(idx)}
                                            className={'flex-1 cursor-text whitespace-pre-wrap text-[13px] ' + (step ? '' : 'italic text-muted-foreground')}
                                        >
                                            {step || 'Click to write this step…'}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                                        className="size-6 shrink-0 rounded text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-destructive group-hover:opacity-100"
                                        aria-label={`Remove step ${idx + 1}`}
                                    >
                                        <Trash2 className="mx-auto size-3.5" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => {
                                    setSteps([...steps, '']);
                                    setEditingStepIdx(steps.length);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-transparent px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-foreground"
                            >
                                <Plus className="size-3.5" />
                                Add step
                            </button>
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
