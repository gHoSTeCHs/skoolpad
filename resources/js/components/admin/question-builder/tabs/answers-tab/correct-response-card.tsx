import { CheckCircle2, ExternalLink } from 'lucide-react';
import { AnswerKeyBody } from '@/components/skoolpad/questions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContentRenderer } from '@/components/shared/content-renderer';
import { nodeToShowcase } from '@/lib/question-node-to-showcase';
import type { FillBlankConfig, QuestionNode, QuestionType } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';
import { findQuickAnswer } from './_shared/answer-fill-utils';

interface CorrectResponseCardProps {
    question: QuestionNode;
    onEditOnQuestionTab: () => void;
}

interface RubricCriterion {
    label?: string;
    text?: string;
    points?: number;
}

interface FreeFormConfig {
    minWords?: number;
    maxWords?: number;
    rubric?: RubricCriterion[];
}

const FREE_FORM_TYPES: QuestionType[] = ['theory', 'short_answer', 'essay'];
const QR_BODY_TYPES: QuestionType[] = [
    'mcq', 'multi_select_mcq', 'true_false', 'matching', 'ordering',
    'matrix_matching', 'cloze', 'calculation', 'numeric_entry',
    'diagram_label', 'assertion_reason',
];

function hasConfiguredResponse(question: QuestionNode): boolean {
    const cfg = question.response_config;
    if (!cfg) return false;
    if (typeof cfg !== 'object') return false;
    return Object.keys(cfg).length > 0;
}

export function CorrectResponseCard({ question, onEditOnQuestionTab }: CorrectResponseCardProps) {
    if (question.question_type === 'group') return null;

    return (
        <article className="ed-card" data-correct="true">
            <header className="ed-card-head">
                <div className="left">
                    <span className="depth-icon correct-icon" aria-hidden>
                        <CheckCircle2 className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="title">Correct response</p>
                        <p className="sub">structured · type-specific · what the engine grades against</p>
                    </div>
                </div>
                <div className="right">
                    <Badge variant="default">Locked · saved</Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEditOnQuestionTab}
                        className="gap-1"
                    >
                        Edit on Question tab
                        <ExternalLink className="size-3" />
                    </Button>
                </div>
            </header>

            <div className="ed-card-body">
                <CorrectResponseBody question={question} onEditOnQuestionTab={onEditOnQuestionTab} />

                <div className="qb-sot-note">
                    <p>
                        <strong>For free-form types</strong> (Theory · ShortAnswer · Essay) this card holds
                        the model answer + rubric.
                    </p>
                    <p className="mt-1">
                        <strong>For Group questions</strong> this card is suppressed — children carry their own.
                    </p>
                </div>
            </div>
        </article>
    );
}

function CorrectResponseBody({ question, onEditOnQuestionTab }: CorrectResponseCardProps) {
    const type = question.question_type;

    if (FREE_FORM_TYPES.includes(type)) {
        return <FreeFormCorrectBody question={question} onEditOnQuestionTab={onEditOnQuestionTab} />;
    }

    if (type === 'fill_blank') {
        return <FillBlankCorrectBody question={question} onEditOnQuestionTab={onEditOnQuestionTab} />;
    }

    if (!hasConfiguredResponse(question)) {
        return <EmptyConfigState onEditOnQuestionTab={onEditOnQuestionTab} />;
    }

    if (QR_BODY_TYPES.includes(type)) {
        return <AnswerKeyBody q={nodeToShowcase(question)} />;
    }

    return <EmptyConfigState onEditOnQuestionTab={onEditOnQuestionTab} />;
}

function EmptyConfigState({ onEditOnQuestionTab }: { onEditOnQuestionTab: () => void }) {
    return (
        <div className="rounded-md border border-dashed border-border bg-[var(--bg-raised)] px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No response configured yet.</p>
            <Button
                variant="link"
                size="sm"
                onClick={onEditOnQuestionTab}
                className="mt-1 h-auto p-0"
            >
                Configure on the Question tab →
            </Button>
        </div>
    );
}

function FillBlankCorrectBody({ question, onEditOnQuestionTab }: CorrectResponseCardProps) {
    const config = question.response_config as FillBlankConfig | null;
    const blanks = config?.blanks ?? [];

    if (blanks.length === 0) {
        return <EmptyConfigState onEditOnQuestionTab={onEditOnQuestionTab} />;
    }

    return (
        <div className="space-y-3">
            <div
                className="rounded-md border border-border bg-[var(--bg-raised)] px-3 py-2 text-sm leading-relaxed text-foreground"
                style={{ fontFamily: 'var(--font-content)' }}
            >
                {renderStemWithBlanks(question.content, blanks.length)}
            </div>
            <div className="space-y-1.5">
                {blanks.map((blank) => (
                    <div
                        key={blank.position}
                        className="flex flex-wrap items-center gap-2 text-xs"
                        style={{ fontFamily: 'var(--font-body)' }}
                    >
                        <span className="font-bold text-primary">Blank {blank.position}:</span>
                        <div className="flex flex-wrap gap-1">
                            {blank.correct_answers.length === 0 ? (
                                <span className="italic text-muted-foreground">no accepted answers yet</span>
                            ) : (
                                blank.correct_answers.map((answer, i) => (
                                    <span
                                        key={i}
                                        className="rounded border border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)] px-2 py-0.5 font-medium"
                                    >
                                        {answer}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {config?.case_sensitive && (
                <p className="font-mono text-[10px] text-muted-foreground">🔡 case sensitive</p>
            )}
        </div>
    );
}

function renderStemWithBlanks(content: string, blankCount: number) {
    if (!content) {
        return <span className="italic text-muted-foreground">(no stem written)</span>;
    }
    const parts = content.split(/\[\[.*?\]\]/);
    const result: React.ReactNode[] = [];
    parts.forEach((part, i) => {
        result.push(<span key={`p-${i}`}>{part}</span>);
        if (i < parts.length - 1) {
            result.push(
                <span
                    key={`b-${i}`}
                    className="mx-0.5 inline-flex items-center justify-center rounded border border-dashed border-primary/40 bg-[var(--bg-raised)] px-2 py-0.5 font-mono text-[11px] text-primary"
                >
                    blank {i + 1}
                </span>,
            );
        }
    });
    if (parts.length === 1 && blankCount > 0) {
        return (
            <>
                {result}
                <span className="ml-1 italic text-muted-foreground">
                    (configured {blankCount} blank{blankCount === 1 ? '' : 's'} but stem has no [[…]] markers)
                </span>
            </>
        );
    }
    return result;
}

function FreeFormCorrectBody({ question, onEditOnQuestionTab }: CorrectResponseCardProps) {
    const modelAnswer = findQuickAnswer(question);
    const config = (question.response_config as FreeFormConfig | null) ?? null;
    const rubric = config?.rubric ?? [];
    const wordRange = formatWordRange(config);

    return (
        <div className="space-y-4">
            <ModelAnswerCard content={modelAnswer} onEditOnQuestionTab={onEditOnQuestionTab} />
            <RubricCard
                rubric={rubric}
                wordRange={wordRange}
                onEditOnQuestionTab={onEditOnQuestionTab}
            />
        </div>
    );
}

function ModelAnswerCard({
    content,
    onEditOnQuestionTab,
}: {
    content: TiptapJSON | null;
    onEditOnQuestionTab: () => void;
}) {
    return (
        <section className="rounded-md border border-border bg-background">
            <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <div>
                    <p
                        className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Model answer
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        sourced from the Quick depth — single source of truth
                    </p>
                </div>
            </header>
            <div className="px-3 py-3">
                {content ? (
                    <ContentRenderer
                        content={content}
                        className="text-sm leading-relaxed text-foreground"
                    />
                ) : (
                    <div className="rounded border border-dashed border-border bg-[var(--bg-raised)] px-3 py-4 text-center text-sm text-muted-foreground">
                        <p>No model answer yet.</p>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={onEditOnQuestionTab}
                            className="mt-1 h-auto p-0"
                        >
                            Author the Quick depth below →
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}

function RubricCard({
    rubric,
    wordRange,
    onEditOnQuestionTab,
}: {
    rubric: RubricCriterion[];
    wordRange: string | null;
    onEditOnQuestionTab: () => void;
}) {
    return (
        <section className="rounded-md border border-border bg-background">
            <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <div>
                    <p
                        className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Rubric
                    </p>
                    {wordRange ? (
                        <p className="text-[11px] text-muted-foreground">{wordRange}</p>
                    ) : (
                        <p className="text-[11px] text-muted-foreground">no word range set</p>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEditOnQuestionTab}
                    className="gap-1 text-xs"
                >
                    Edit
                    <ExternalLink className="size-3" />
                </Button>
            </header>
            <div className="px-3 py-3">
                {rubric.length === 0 ? (
                    <p className="rounded border border-dashed border-border bg-[var(--bg-raised)] px-3 py-3 text-center text-xs italic text-muted-foreground">
                        No rubric criteria yet — graders will use a generic mark scheme.
                    </p>
                ) : (
                    <table className="w-full text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        <thead>
                            <tr className="border-b border-border/60 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                <th
                                    className="pb-2 pr-3"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    Criterion
                                </th>
                                <th
                                    className="pb-2 text-right"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    Points
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rubric.map((criterion, idx) => (
                                <tr key={idx} className="border-b border-border/30 last:border-b-0">
                                    <td className="py-2 pr-3 align-top">
                                        {criterion.label && (
                                            <span className="mr-2 font-mono text-[11px] text-primary">
                                                {criterion.label}
                                            </span>
                                        )}
                                        <span className="text-foreground">
                                            {criterion.text || (
                                                <em className="text-muted-foreground">(empty criterion)</em>
                                            )}
                                        </span>
                                    </td>
                                    <td className="py-2 text-right align-top font-mono text-xs font-semibold text-foreground">
                                        {typeof criterion.points === 'number' ? criterion.points : '–'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

function formatWordRange(config: FreeFormConfig | null): string | null {
    if (!config) return null;
    const { minWords, maxWords } = config;
    if (minWords == null && maxWords == null) return null;
    if (minWords != null && maxWords != null) return `${minWords}–${maxWords} words expected`;
    if (minWords != null) return `at least ${minWords} words expected`;
    if (maxWords != null) return `up to ${maxWords} words expected`;
    return null;
}
