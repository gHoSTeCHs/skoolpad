import { AnswerDepthPanel } from '@/components/admin/answer-depth-panel';
import type { AnswerDepthData, AnswerDepthLevel, QuestionNode } from '@/types/questions';
import type { TiptapJSON } from '@/types/tiptap';

interface AnswersTabProps {
    question: QuestionNode;
}

const DEPTH_META: Record<AnswerDepthLevel, { label: string; description: string }> = {
    quick: {
        label: 'Quick',
        description: '1–2 sentence direct answer. Available to Free tier students.',
    },
    standard: {
        label: 'Standard',
        description: 'Step-by-step explanation with reasoning. Available to Scholar tier.',
    },
    deep_dive: {
        label: 'Deep dive',
        description: 'Comprehensive explanation with examples and related concepts. Scholar Pro tier.',
    },
};

const DEPTH_ORDER: AnswerDepthLevel[] = ['quick', 'standard', 'deep_dive'];

function buildDepthData(question: QuestionNode, depth: AnswerDepthLevel): AnswerDepthData {
    const existing = question.answers?.find((a) => a.depth_level === depth);
    return {
        depth_level: depth,
        label: DEPTH_META[depth].label,
        description: DEPTH_META[depth].description,
        answer: existing
            ? {
                id: existing.id,
                content: (existing.content ?? null) as TiptapJSON,
                content_plain: existing.content_plain,
                is_published: existing.is_published,
            }
            : null,
    };
}

export function AnswersTab({ question }: AnswersTabProps) {
    if (question.question_type === 'group') {
        return (
            <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
                <p className="font-display text-base font-semibold text-foreground">
                    Group questions: children-status matrix coming in 4.D
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Select an individual sub-question to author its answers for now.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {DEPTH_ORDER.map((depth) => (
                <AnswerDepthPanel
                    key={`${question.id}-${depth}`}
                    questionId={question.id}
                    depthData={buildDepthData(question, depth)}
                />
            ))}
        </div>
    );
}
