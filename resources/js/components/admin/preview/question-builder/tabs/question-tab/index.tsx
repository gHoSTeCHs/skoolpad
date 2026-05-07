import type { EnumOption, QuestionNode } from '@/types/questions';
import { FreeFormAuthor } from './free-form-author';

interface QuestionTabProps {
    question: QuestionNode;
    enumOptions: {
        difficulties: EnumOption[];
        bloom_levels?: EnumOption[];
    };
    onDirtyChange: (dirty: boolean) => void;
}

const FREE_FORM_TYPES = new Set(['theory', 'short_answer', 'essay']);

export function QuestionTab({ question, enumOptions, onDirtyChange }: QuestionTabProps) {
    if (FREE_FORM_TYPES.has(question.question_type)) {
        return (
            <FreeFormAuthor
                key={question.id}
                question={question}
                enumOptions={enumOptions}
                onDirtyChange={onDirtyChange}
            />
        );
    }

    return (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="font-display text-base font-semibold text-foreground">
                {question.question_type.replace(/_/g, ' ')} authoring lands in Round 4.C
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
                For the 4.B preview slice, only Theory / Short answer / Essay authoring is wired.
                The other 9 type variants ship with the per-shape Question tab work.
            </p>
        </div>
    );
}
