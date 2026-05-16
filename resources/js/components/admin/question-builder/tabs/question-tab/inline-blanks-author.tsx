'use no memo';

import { useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { EnumOption, FillBlankConfig, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';
import { AcceptChips } from './_shared/accept-chips';

interface InlineBlanksAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
}

const BLANK_RE = /\[\[([^\]]*)\]\]/g;

interface ParsedBlank {
    position: number;
    captured: string;
}

function parseBlanks(stem: string): ParsedBlank[] {
    return Array.from(stem.matchAll(BLANK_RE)).map((m, i) => ({
        position: i + 1,
        captured: (m[1] ?? '').trim(),
    }));
}

function defaultConfig(): FillBlankConfig {
    return {
        blanks: [],
        case_sensitive: false,
    };
}

export function InlineBlanksAuthor({ question, enumOptions }: InlineBlanksAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question);
    const config = (form.data.response_config as FillBlankConfig | null) ?? defaultConfig();
    const stem = form.data.content ?? '';
    const parsed = useMemo(() => parseBlanks(stem), [stem]);

    const setConfig = useCallback((next: FillBlankConfig) => {
        form.setData('response_config', next as never);
    }, [form]);

    const blanks = useMemo(() => {
        const existing = config.blanks ?? [];
        return parsed.map((p) => {
            const existingMatch = existing.find((b) => b.position === p.position);
            if (existingMatch && existingMatch.correct_answers.length > 0) return existingMatch;
            const seed = p.captured ? [p.captured] : [];
            return existingMatch ?? { position: p.position, correct_answers: seed };
        });
    }, [parsed, config.blanks]);

    function setBlankAccepted(position: number, values: string[]) {
        const others = blanks.filter((b) => b.position !== position);
        const updated = [...others, { position, correct_answers: values }]
            .filter((b) => b.correct_answers.length > 0)
            .sort((a, b) => a.position - b.position);
        setConfig({ ...config, blanks: updated });
    }

    const renderedStem = useMemo(() => {
        const parts: React.ReactNode[] = [];
        let lastIdx = 0;
        let blankNum = 0;
        for (const match of stem.matchAll(BLANK_RE)) {
            const matchStart = match.index ?? 0;
            if (matchStart > lastIdx) parts.push(stem.slice(lastIdx, matchStart));
            blankNum += 1;
            parts.push(
                <span
                    key={`blank-${blankNum}-${matchStart}`}
                    className="mx-0.5 inline-flex items-center gap-1 rounded-t border-b-2 border-[var(--badge-primary-fg)] bg-[var(--badge-primary-bg)] px-2 py-0.5 font-mono text-[12px] font-medium text-[var(--badge-primary-fg)]"
                >
                    <span className="rounded-full bg-[var(--badge-primary-fg)] px-1 font-bold text-[9px] text-white">
                        {blankNum}
                    </span>
                    {match[1] || '___'}
                </span>,
            );
            lastIdx = matchStart + match[0].length;
        }
        if (lastIdx < stem.length) parts.push(stem.slice(lastIdx));
        return parts;
    }, [stem]);

    return (
        <form onSubmit={save} className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle>Stem with inline blanks</CardTitle>
                    <CardDescription>
                        Wrap any fill-in target with <code className="rounded bg-[var(--bg-raised)] px-1 py-0.5 font-mono text-[11px]">[[double brackets]]</code>.
                        Each pair auto-creates a numbered blank below.
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

                    {parsed.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                Preview · {parsed.length} blank{parsed.length === 1 ? '' : 's'}
                            </span>
                            <div className="rounded-md border border-border bg-[var(--bg-raised)] px-4 py-3 text-[13.5px] leading-[1.85]">
                                {renderedStem}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {parsed.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Accepted answers per blank</CardTitle>
                        <CardDescription>List all acceptable spellings/forms. Per-blank case-sensitivity toggle below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {blanks.map((blank) => (
                                <div
                                    key={blank.position}
                                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                                >
                                    <span className="rounded-full bg-[var(--badge-primary-fg)] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                                        {blank.position}
                                    </span>
                                    <AcceptChips
                                        values={blank.correct_answers}
                                        onChange={(values) => setBlankAccepted(blank.position, values)}
                                        addLabel="+ add"
                                        placeholder="accepted answer"
                                    />
                                    <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
                                        {config.case_sensitive ? 'exact match' : 'case-insensitive'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                            <Switch
                                id="case_sensitive"
                                checked={config.case_sensitive ?? false}
                                onCheckedChange={(checked) => setConfig({ ...config, case_sensitive: checked })}
                            />
                            <Label htmlFor="case_sensitive" className="cursor-pointer text-[13px]">
                                Case-sensitive grading (applies to all blanks)
                            </Label>
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
