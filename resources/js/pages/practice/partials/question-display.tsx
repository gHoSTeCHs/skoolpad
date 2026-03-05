import { QuestionAnswerInput } from '@/components/skoolpad/practice/question-answer-input';
import ContextCard from '@/components/skoolpad/questions/context-card';
import { ContentRenderer } from '@/components/shared/content-renderer';
import type { AnswerSubmissionResponse, PracticeAnswerData, PracticeQuestionData } from '@/types/practice';

interface QuestionDisplayProps {
    question: PracticeQuestionData;
    onSubmit: (data: Record<string, unknown>) => void;
    onSkip: () => void;
    feedback: AnswerSubmissionResponse | null;
    readOnly: boolean;
    existingAnswer: PracticeAnswerData | null;
}

export function QuestionDisplay({ question, onSubmit, onSkip, feedback, readOnly, existingAnswer }: QuestionDisplayProps) {
    const hasAnswered = !!existingAnswer || !!feedback;

    return (
        <div className="space-y-4">
            {question.contexts.length > 0 && (
                <div className="space-y-2">
                    {question.contexts.map((ctx) => (
                        <ContextCard
                            key={ctx.id}
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
