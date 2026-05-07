import type { EnumOption, QuestionNode, QuestionType } from '@/types/questions';
import { FreeFormAuthor } from './free-form-author';
import { SingleChoiceAuthor } from './single-choice-author';
import { MultiChoiceAuthor } from './multi-choice-author';
import { BooleanAuthor } from './boolean-author';
import { InlineBlanksAuthor } from './inline-blanks-author';
import { MatchingAuthor } from './matching-author';
import { OrderingAuthor } from './ordering-author';
import { MatrixMatchingAuthor } from './matrix-matching-author';
import { NumericAuthor } from './numeric-author';
import { DiagramLabelAuthor } from './diagram-label-author';
import { AssertionReasonAuthor } from './assertion-reason-author';
import { GroupAuthor } from './group-author';

interface QuestionTabProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

export function QuestionTab({ question, enumOptions, onDirtyChange }: QuestionTabProps) {
    return getAuthor(question.question_type, { question, enumOptions, onDirtyChange });
}

function getAuthor(
    type: QuestionType,
    props: { question: QuestionNode; enumOptions: QuestionTabProps['enumOptions']; onDirtyChange: (dirty: boolean) => void },
): React.ReactNode {
    const key = props.question.id;
    switch (type) {
        case 'mcq':
            return <SingleChoiceAuthor key={key} {...props} />;
        case 'multi_select_mcq':
            return <MultiChoiceAuthor key={key} {...props} />;
        case 'true_false':
            return <BooleanAuthor key={key} {...props} />;
        case 'fill_blank':
        case 'cloze':
            return <InlineBlanksAuthor key={key} {...props} />;
        case 'matching':
            return <MatchingAuthor key={key} {...props} />;
        case 'ordering':
            return <OrderingAuthor key={key} {...props} />;
        case 'matrix_matching':
            return <MatrixMatchingAuthor key={key} {...props} />;
        case 'calculation':
        case 'numeric_entry':
            return <NumericAuthor key={key} {...props} />;
        case 'diagram_label':
            return <DiagramLabelAuthor key={key} {...props} />;
        case 'assertion_reason':
            return <AssertionReasonAuthor key={key} {...props} />;
        case 'theory':
        case 'short_answer':
        case 'essay':
            return <FreeFormAuthor key={key} {...props} />;
        case 'group':
            return <GroupAuthor key={key} {...props} />;
        default: {
            const exhaustiveCheck: never = type;
            return (
                <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
                    <p className="font-display text-base font-semibold text-foreground">
                        Unsupported type: {String(exhaustiveCheck)}
                    </p>
                </div>
            );
        }
    }
}
