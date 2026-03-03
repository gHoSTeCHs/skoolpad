import { cn } from '@/lib/utils';
import type { PracticeAnswerData, PracticeQuestionData } from '@/types/practice';

interface ProgressBarProps {
    questions: PracticeQuestionData[];
    answers: Record<string, PracticeAnswerData>;
}

export function ProgressBar({ questions, answers }: ProgressBarProps) {
    const total = questions.length;
    if (total === 0) return null;

    return (
        <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
            {questions.map((q) => {
                const answer = answers[q.id];
                let color = 'bg-muted';
                if (answer?.was_skipped) color = 'bg-yellow-400 dark:bg-yellow-500 reader:bg-yellow-500';
                else if (answer?.is_correct === true) color = 'bg-emerald-500';
                else if (answer?.is_correct === false) color = 'bg-destructive';
                else if (answer) color = 'bg-blue-400';

                return <div key={q.id} className={cn('h-full flex-1 transition-colors', color)} />;
            })}
        </div>
    );
}
