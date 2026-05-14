import { useEffect, useRef, useState } from 'react';
import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';
import '../../answer-builder.css';
import { CorrectResponseCard } from './correct-response-card';
import { DepthCard } from './depth-card';
import { GroupChildrenMatrix } from './group-children-matrix';
import { buildDepthData } from './_shared/answer-fill-utils';
import { DEPTH_ORDER } from './_shared/depth-meta';

interface AnswersTabProps {
    question: QuestionNode;
    initialDepth: AnswerDepthLevel | null;
    onInitialDepthConsumed: () => void;
    onSelectChildDepth: (childId: string, depth: AnswerDepthLevel) => void;
    onEditOnQuestionTab: () => void;
    onDirtyChange: (dirty: boolean) => void;
}

export function AnswersTab({
    question,
    initialDepth,
    onInitialDepthConsumed,
    onSelectChildDepth,
    onEditOnQuestionTab,
    onDirtyChange,
}: AnswersTabProps) {
    if (question.question_type === 'group') {
        return (
            <div className="qb-answer space-y-5">
                <GroupChildrenMatrix parent={question} onSelectChildDepth={onSelectChildDepth} />
            </div>
        );
    }

    return (
        <LeafAnswers
            question={question}
            initialDepth={initialDepth}
            onInitialDepthConsumed={onInitialDepthConsumed}
            onEditOnQuestionTab={onEditOnQuestionTab}
            onDirtyChange={onDirtyChange}
        />
    );
}

interface LeafProps {
    question: QuestionNode;
    initialDepth: AnswerDepthLevel | null;
    onInitialDepthConsumed: () => void;
    onEditOnQuestionTab: () => void;
    onDirtyChange: (dirty: boolean) => void;
}

function LeafAnswers({
    question,
    initialDepth,
    onInitialDepthConsumed,
    onEditOnQuestionTab,
    onDirtyChange,
}: LeafProps) {
    const [dirtyByDepth, setDirtyByDepth] = useState<Record<AnswerDepthLevel, boolean>>({
        quick: false,
        standard: false,
        deep_dive: false,
    });

    useEffect(() => {
        const anyDirty = DEPTH_ORDER.some((d) => dirtyByDepth[d]);
        onDirtyChange(anyDirty);
    }, [dirtyByDepth, onDirtyChange]);

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

    function setDepthDirty(depth: AnswerDepthLevel, dirty: boolean) {
        setDirtyByDepth((prev) => (prev[depth] === dirty ? prev : { ...prev, [depth]: dirty }));
    }

    return (
        <div ref={containerRef} className="qb-answer space-y-5">
            <CorrectResponseCard question={question} onEditOnQuestionTab={onEditOnQuestionTab} />

            {DEPTH_ORDER.map((depth) => (
                <DepthCard
                    key={`${question.id}-${depth}`}
                    questionId={question.id}
                    depthData={buildDepthData(question, depth)}
                    onDirtyChange={(dirty) => setDepthDirty(depth, dirty)}
                />
            ))}
        </div>
    );
}
