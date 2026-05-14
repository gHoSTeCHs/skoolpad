'use no memo';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QuestionTypeBadge } from '@/components/skoolpad/questions';
import { Plus } from 'lucide-react';
import type { EnumOption, QuestionNode } from '@/types/questions';
import { useQuestionForm } from './_shared/use-question-form';
import { StemCard } from './_shared/stem-card';
import { MetadataCard } from './_shared/metadata-card';
import { SaveBar } from './_shared/save-bar';

interface GroupAuthorProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
}

export function GroupAuthor({ question, enumOptions }: GroupAuthorProps) {
    const { form, isDirty, save } = useQuestionForm(question);
    const children = question.children ?? [];

    return (
        <form onSubmit={save} className="space-y-5">
            <StemCard
                title="Group stem"
                description="Shared context for all child questions in this group. Each child has its own type and grading."
                placeholder="Type the shared context for all children…"
                valueDoc={form.data.content_doc}
                error={form.errors.content}
                onChange={(json, plain) => form.setData((prev) => ({ ...prev, content: plain, content_doc: json }))}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Children ({children.length})</CardTitle>
                    <CardDescription>
                        Sub-questions belonging to this group. Add child questions from the tree (left pane).
                        Max nesting depth is 3.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {children.length === 0 ? (
                            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                                No children yet — add the first child question from the tree
                            </p>
                        ) : (
                            children.map((child) => (
                                <div
                                    key={child.id}
                                    className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2"
                                >
                                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40 mt-1.5" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[12px] font-bold text-primary">
                                                {child.question_number || child.display_label || '·'}
                                            </span>
                                            <QuestionTypeBadge
                                                type={child.question_type}
                                                className="shrink-0 px-1 py-0 text-[8px]"
                                            />
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-foreground">
                                            {child.content || <span className="italic text-muted-foreground">Untitled</span>}
                                        </p>
                                    </div>
                                    {child.marks !== null && (
                                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{child.marks}m</span>
                                    )}
                                </div>
                            ))
                        )}

                        <button
                            type="button"
                            disabled
                            title="Add child questions from the tree (left pane)"
                            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2 font-mono text-xs text-muted-foreground opacity-60"
                        >
                            <Plus className="size-3.5" />
                            Add child question (use the tree)
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
