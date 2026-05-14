import type { AnswerDepthLevel, QuestionNode } from '@/types/questions';
import '../../answer-builder.css';
import { GroupChildrenMatrix } from './group-children-matrix';
import { LeafAnswers } from './leaf-answers';

interface AnswersTabProps {
    question: QuestionNode;
    initialDepth: AnswerDepthLevel | null;
    onInitialDepthConsumed: () => void;
    onSelectChildDepth: (childId: string, depth: AnswerDepthLevel) => void;
    onEditOnQuestionTab: () => void;
}

export function AnswersTab({
    question,
    initialDepth,
    onInitialDepthConsumed,
    onSelectChildDepth,
    onEditOnQuestionTab,
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
        />
    );
}
