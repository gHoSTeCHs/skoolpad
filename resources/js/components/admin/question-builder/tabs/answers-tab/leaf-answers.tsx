import { useEffect, useRef } from 'react';
import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';
import { CorrectResponseCard } from './correct-response-card';
import { DepthCard } from './depth-card';
import { buildDepthData } from './_shared/answer-fill-utils';
import { DEPTH_ORDER } from './_shared/depth-meta';

interface LeafAnswersProps {
    question: QuestionNode;
    initialDepth: AnswerDepthLevel | null;
    onInitialDepthConsumed: () => void;
    onEditOnQuestionTab: () => void;
}

/**
 * The non-group Answers tab body: a read-only Correct Response card plus one
 * DepthCard per depth. Each DepthCard registers its own dirty state into the
 * builder store via useEditorForm — no aggregation needed here.
 */
export function LeafAnswers({
    question,
    initialDepth,
    onInitialDepthConsumed,
    onEditOnQuestionTab,
}: LeafAnswersProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!initialDepth || !containerRef.current) return;
        const target = containerRef.current.querySelector<HTMLElement>(
            `[data-depth="${initialDepth}"]`,
        );
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        onInitialDepthConsumed();
    }, [initialDepth, onInitialDepthConsumed, question.id]);

    return (
        <div ref={containerRef} className="qb-answer space-y-5">
            <CorrectResponseCard question={question} onEditOnQuestionTab={onEditOnQuestionTab} />

            {DEPTH_ORDER.map((depth) => (
                <DepthCard
                    key={`${question.id}-${depth}`}
                    questionId={question.id}
                    depthData={buildDepthData(question, depth)}
                />
            ))}
        </div>
    );
}
