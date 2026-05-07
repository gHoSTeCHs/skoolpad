'use no memo';

import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { AssertionReasonConfig, EnumOption, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

interface AssertionReasonAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

const STANDARD_OPTIONS = [
    { label: 'A', text: 'Both A and R are true; R is the correct explanation of A' },
    { label: 'B', text: 'Both A and R are true; R is NOT the correct explanation of A' },
    { label: 'C', text: 'A is true but R is false' },
    { label: 'D', text: 'A is false but R is true' },
    { label: 'E', text: 'Both A and R are false' },
] as const;

function defaultConfig(): AssertionReasonConfig {
    return {
        assertion: '',
        reason: '',
        options: STANDARD_OPTIONS.map((o) => ({ ...o, is_correct: false })),
    };
}

export function AssertionReasonAuthor({ question, enumOptions, onDirtyChange }: AssertionReasonAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question, onDirtyChange);
    const config = (form.data.response_config as AssertionReasonConfig | null) ?? defaultConfig();

    const setConfig = useCallback((next: AssertionReasonConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    function setCorrect(idx: number) {
        setConfig({
            ...config,
            options: STANDARD_OPTIONS.map((opt, i) => ({ ...opt, is_correct: i === idx })),
        });
    }

    return (
        <form onSubmit={save} className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>Assertion + Reason</CardTitle>
                    <CardDescription>
                        Author writes the assertion and reason text. The 5-option template is fixed — pick which option is correct.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="assertion" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Assertion (A)
                            </Label>
                            <textarea
                                id="assertion"
                                rows={2}
                                value={config.assertion}
                                onChange={(e) => setConfig({ ...config, assertion: e.target.value })}
                                placeholder="Type the assertion claim…"
                                className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-[var(--fg-subtle)]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reason" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Reason (R)
                            </Label>
                            <textarea
                                id="reason"
                                rows={2}
                                value={config.reason}
                                onChange={(e) => setConfig({ ...config, reason: e.target.value })}
                                placeholder="Type the reasoning that supports (or appears to support) it…"
                                className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none focus:border-[var(--fg-subtle)]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Standard 5 options</CardTitle>
                    <CardDescription>Click the option that correctly describes the relationship.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1.5">
                        {STANDARD_OPTIONS.map((opt, idx) => {
                            const isCorrect = config.options[idx]?.is_correct ?? false;
                            return (
                                <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => setCorrect(idx)}
                                    className={
                                        'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors '
                                        + (isCorrect
                                            ? 'border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)]'
                                            : 'border-border hover:border-[var(--fg-subtle)]')
                                    }
                                >
                                    <span
                                        className={
                                            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold '
                                            + (isCorrect
                                                ? 'bg-[var(--opt-correct-dot)] text-white'
                                                : 'bg-[var(--bg-raised)] text-muted-foreground')
                                        }
                                    >
                                        {isCorrect ? '✓' : opt.label}
                                    </span>
                                    <span className="flex-1">{opt.text}</span>
                                </button>
                            );
                        })}
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
