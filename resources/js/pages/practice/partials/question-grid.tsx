import { cn } from '@/lib/utils';
import type { PracticeAnswerData, PracticeQuestionData } from '@/types/practice';

interface QuestionGridProps {
    questions: PracticeQuestionData[];
    answers: Record<string, PracticeAnswerData>;
    currentIndex: number;
    onSelect: (index: number) => void;
}

export function QuestionGrid({ questions, answers, currentIndex, onSelect }: QuestionGridProps) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {questions.map((q, i) => {
                const answer = answers[q.id];
                const isCurrent = i === currentIndex;

                let dotColor = '';
                if (answer?.was_skipped) dotColor = 'bg-yellow-400';
                else if (answer?.is_correct === true) dotColor = 'bg-emerald-500';
                else if (answer?.is_correct === false) dotColor = 'bg-destructive';
                else if (answer) dotColor = 'bg-blue-400';

                return (
                    <button
                        key={q.id}
                        type="button"
                        onClick={() => onSelect(i)}
                        className={cn(
                            'relative flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-all',
                            isCurrent
                                ? 'ring-2 ring-primary bg-primary/10 text-primary font-bold'
                                : 'border border-border bg-background hover:bg-accent',
                            answer && !isCurrent && 'text-muted-foreground',
                        )}
                    >
                        {i + 1}
                        {dotColor && (
                            <span className={cn('absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background', dotColor)} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
