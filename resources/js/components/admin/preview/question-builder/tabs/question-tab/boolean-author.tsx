'use no memo';

import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { EnumOption, QuestionNode, TrueFalseConfig } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

interface BooleanAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

const DEFAULTS: TrueFalseConfig = { correct_answer: true, requires_justification: false };

export function BooleanAuthor({ question, enumOptions, onDirtyChange }: BooleanAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question, onDirtyChange);
    const config = (form.data.response_config as TrueFalseConfig | null) ?? DEFAULTS;

    const setConfig = useCallback((next: TrueFalseConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Proposition"
                description="A statement the student must judge as true or false."
                placeholder="Type the proposition…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Correct answer</CardTitle>
                    <CardDescription>Click a pill to mark it correct. Keyboard: T or F.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        {([true, false] as const).map((value) => {
                            const isCorrect = config.correct_answer === value;
                            return (
                                <button
                                    key={String(value)}
                                    type="button"
                                    onClick={() => setConfig({ ...config, correct_answer: value })}
                                    className={
                                        'inline-flex items-center justify-center rounded-full px-5 py-1.5 font-mono text-[13px] font-semibold tracking-wider transition-colors '
                                        + (isCorrect
                                            ? 'border border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)] text-[var(--opt-correct-dot)]'
                                            : 'border border-border bg-card text-muted-foreground hover:border-[var(--fg-subtle)] hover:text-foreground')
                                    }
                                    aria-pressed={isCorrect}
                                >
                                    {value ? 'TRUE' : 'FALSE'}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch
                            id="requires_justification"
                            checked={config.requires_justification ?? false}
                            onCheckedChange={(checked) => setConfig({ ...config, requires_justification: checked })}
                        />
                        <Label htmlFor="requires_justification" className="cursor-pointer">
                            Require justification (routes to manual grading)
                        </Label>
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
