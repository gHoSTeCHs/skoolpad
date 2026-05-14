import type { QuestionNode } from '@/types/questions';

type AnswerFill = 'published' | 'draft' | 'empty';

const ANSWER_DEPTHS = ['quick', 'standard', 'deep_dive'] as const;
const ANSWER_DEPTH_LABELS: Record<typeof ANSWER_DEPTHS[number], string> = {
    quick: 'Quick',
    standard: 'Standard',
    deep_dive: 'Deep dive',
};

function getAnswerFill(
    answers: QuestionNode['answers'],
    depth: typeof ANSWER_DEPTHS[number],
): AnswerFill {
    const answer = answers?.find((a) => a.depth_level === depth);
    if (!answer) return 'empty';
    return answer.is_published ? 'published' : 'draft';
}

export function AnswerStatusDots({ question }: { question: QuestionNode }) {
    const isGroup = question.question_type === 'group';
    const fills = ANSWER_DEPTHS.map((d) => getAnswerFill(question.answers, d));
    const filledCount = fills.filter((f) => f !== 'empty').length;
    const dimmed = isGroup || filledCount === 0;

    const tooltip = isGroup
        ? 'Group — children carry answers'
        : ANSWER_DEPTHS
            .map((d, i) => `${ANSWER_DEPTH_LABELS[d]}: ${fills[i]}`)
            .join(' · ');

    return (
        <span
            className={
                'inline-flex shrink-0 items-center gap-[3px] rounded-full border border-border bg-[var(--bg-raised)] px-2 py-[5px]'
                + (dimmed ? ' opacity-[0.55]' : '')
            }
            title={tooltip}
            aria-label={tooltip}
        >
            {fills.map((fill, i) => (
                <span
                    key={i}
                    className={
                        'h-1.5 w-1.5 rounded-full'
                        + (fill === 'published'
                            ? ' bg-[var(--success)]'
                            : fill === 'draft'
                                ? ' bg-[var(--warning)]'
                                : ' bg-border/85')
                    }
                />
            ))}
        </span>
    );
}
