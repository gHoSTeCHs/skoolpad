import { useState } from 'react';

import { QuestionAnswerInput } from '@/components/skoolpad/practice/question-answer-input';
import ContextCard from '@/components/skoolpad/questions/context-card';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AnswerSubmissionResponse, PracticeAnswerData, PracticeQuestionData } from '@/types/practice';

interface QuestionDisplayProps {
    question: PracticeQuestionData;
    onSubmit: (data: Record<string, unknown>) => void;
    onSkip: () => void;
    feedback: AnswerSubmissionResponse | null;
    readOnly: boolean;
    existingAnswer: PracticeAnswerData | null;
    persistedContextIds?: string[];
}

export function QuestionDisplay({ question, onSubmit, onSkip, feedback, readOnly, existingAnswer, persistedContextIds = [] }: QuestionDisplayProps) {
    const hasAnswered = !!existingAnswer || !!feedback;

    const newContexts = question.contexts.filter((ctx) => !persistedContextIds.includes(ctx.id));
    const sharedContexts = question.contexts.filter((ctx) => persistedContextIds.includes(ctx.id));

    return (
        <div className="space-y-4">
            {sharedContexts.length > 0 && (
                <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Context from previous question still applies
                    </p>
                </div>
            )}

            {newContexts.length > 0 && (
                <div className="space-y-2">
                    {newContexts.map((ctx) => (
                        <CollapsibleContext key={ctx.id} ctx={ctx} />
                    ))}
                </div>
            )}

            <div className="prose prose-sm dark:prose-invert reader:prose-invert max-w-none" style={{ fontFamily: 'var(--font-content)' }}>
                <ContentRenderer content={question.content} />
            </div>

            {question.marks && (
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                </span>
            )}

            <div className="pt-2">
                <QuestionAnswerInput
                    questionType={question.question_type}
                    responseConfig={question.response_config}
                    onSubmit={onSubmit}
                    feedback={feedback ? {
                        isCorrect: feedback.is_correct,
                        correctAnswer: feedback.correct_answer,
                    } : (existingAnswer ? {
                        isCorrect: existingAnswer.is_correct,
                        correctAnswer: null,
                    } : null)}
                    readOnly={readOnly}
                    existingAnswer={existingAnswer?.response_data as Record<string, unknown> | null}
                    mediaUrl={question.contexts.find((ctx) => ctx.context_type === 'diagram')?.media_url}
                />
            </div>

            {feedback?.quick_answer_content && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30 reader:border-emerald-800 reader:bg-emerald-950/30">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 reader:text-emerald-400" style={{ fontFamily: 'var(--font-body)' }}>
                        Quick Explanation
                    </p>
                    <div className="text-sm" style={{ fontFamily: 'var(--font-content)' }}>
                        <ContentRenderer content={feedback.quick_answer_content as unknown as string} />
                    </div>
                </div>
            )}

            {!hasAnswered && !readOnly && (
                <button
                    type="button"
                    onClick={onSkip}
                    className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                    Skip this question
                </button>
            )}
        </div>
    );
}

function CollapsibleContext({ ctx }: { ctx: PracticeQuestionData['contexts'][number] }) {
    const [open, setOpen] = useState(true);
    const typeLabel = ctx.context_type.replace('_', ' ');

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-t-lg px-2 py-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className={`size-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
                    >
                        <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                    <span className="uppercase tracking-wider">{typeLabel} context</span>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <ContextCard
                    context={{
                        id: ctx.id,
                        contextType: ctx.context_type,
                        title: ctx.title ?? undefined,
                        content: ctx.content ?? undefined,
                        mediaUrl: ctx.media_url ?? undefined,
                        tableData: ctx.table_data ?? undefined,
                        wordBank: ctx.word_bank ?? undefined,
                    }}
                />
            </CollapsibleContent>
        </Collapsible>
    );
}
