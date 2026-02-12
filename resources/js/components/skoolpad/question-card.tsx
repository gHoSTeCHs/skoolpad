import { cn } from '@/lib/utils';
import { useState } from 'react';

type OptionState = 'default' | 'selected' | 'correct' | 'wrong';

interface AnswerOption {
    label: string;
    text: string;
    state?: OptionState;
}

interface QuestionCardProps {
    institution: string;
    courseCode: string;
    session: string;
    questionNumber: number;
    totalQuestions: number;
    questionText: string;
    options: AnswerOption[];
    className?: string;
}

const optionStateStyles: Record<OptionState, string> = {
    default: 'border-border hover:border-[var(--opt-hover-border)] hover:bg-[var(--opt-hover-bg)]',
    selected: 'border-[var(--opt-selected-border)] bg-[var(--opt-selected-bg)]',
    correct: 'border-[var(--opt-correct-border)] bg-[var(--opt-correct-bg)]',
    wrong: 'border-[var(--opt-wrong-border)] bg-[var(--opt-wrong-bg)]',
};

const dotStyles: Record<OptionState, string> = {
    default: 'border-border text-muted-foreground',
    selected: 'border-[var(--opt-correct-dot)] bg-[var(--opt-correct-dot)] text-white reader:text-[#0A1929]',
    correct: 'border-[var(--opt-correct-dot)] bg-[var(--opt-correct-dot)] text-white reader:text-[#0A1929]',
    wrong: 'border-[var(--opt-wrong-dot)] bg-[var(--opt-wrong-dot)] text-white',
};

export default function QuestionCard({
    institution,
    courseCode,
    session,
    questionNumber,
    totalQuestions,
    questionText,
    options: initialOptions,
    className,
}: QuestionCardProps) {
    const [selected, setSelected] = useState<string | null>(null);

    const handleSelect = (label: string, state?: OptionState) => {
        if (state === 'correct' || state === 'wrong') return;
        setSelected(label);
    };

    return (
        <div
            className={cn('border-[1.5px] border-border bg-card p-[22px]', className)}
            style={{ borderRadius: '14px' }}
        >
            <div className="mb-[14px] flex items-start justify-between">
                <div>
                    <div
                        className="mb-[5px] text-[11px] tracking-[0.04em]"
                        style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}
                    >
                        {institution} &middot; {courseCode} &middot; {session}
                    </div>
                    <div
                        className="text-[16px] font-semibold"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Question {questionNumber} of {totalQuestions}
                    </div>
                </div>
                <span
                    className="rounded-full px-[10px] py-1 text-[11px] font-semibold"
                    style={{
                        background: 'var(--badge-neutral-bg)',
                        color: 'var(--badge-neutral-fg)',
                        fontFamily: 'var(--font-body)',
                    }}
                >
                    Objective
                </span>
            </div>

            <div
                className="mb-4 leading-relaxed"
                style={{
                    fontFamily: 'var(--font-content)',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: 'var(--text-2)',
                }}
            >
                {questionText}
            </div>

            <div className="flex flex-col gap-2">
                {initialOptions.map((option) => {
                    const state = option.state || (selected === option.label ? 'selected' : 'default');
                    const dotContent = state === 'correct' ? '\u2713' : state === 'wrong' ? '\u2717' : option.label;

                    return (
                        <div
                            key={option.label}
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] px-[14px] py-[11px] transition-all duration-150',
                                optionStateStyles[state],
                            )}
                            style={{ fontFamily: 'var(--font-content)', fontSize: '14px', color: 'var(--text-2)' }}
                            onClick={() => handleSelect(option.label, option.state)}
                        >
                            <div
                                className={cn(
                                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-150',
                                    dotStyles[state],
                                )}
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                {dotContent}
                            </div>
                            {option.text}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
