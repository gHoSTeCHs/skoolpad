import { cn } from '@/lib/utils';
import type { QuestionSection } from '@/types/questions';

interface SectionRowProps {
    section: QuestionSection;
    index: number;
    isSelected: boolean;
    onSelect: (sectionId: string) => void;
}

function sectionLetter(index: number): string {
    return String.fromCharCode(65 + (index % 26));
}

export function SectionRow({ section, index, isSelected, onSelect }: SectionRowProps) {
    const letter = sectionLetter(index);
    const count = section.questions.length;
    const marks = section.marks;

    return (
        <button
            type="button"
            onClick={() => onSelect(section.id)}
            aria-current={isSelected ? 'true' : undefined}
            className={cn(
                'group -ml-px flex w-full items-center gap-2.5 rounded-md border-l-2 px-3 py-2.5 text-left transition-colors',
                isSelected
                    ? 'border-primary bg-secondary'
                    : 'border-transparent hover:bg-[var(--bg-raised)]',
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-display text-[12.5px] font-semibold transition-colors',
                    isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-[var(--bg-raised)] text-muted-foreground group-hover:bg-card',
                )}
            >
                {letter}
            </span>
            <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium text-foreground">
                    {section.label}
                </div>
                {marks != null && (
                    <div className="font-mono text-[10px] tracking-wide text-[var(--fg-subtle)]">
                        {marks} marks
                    </div>
                )}
            </div>
            <span
                className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]',
                    isSelected
                        ? 'bg-primary/15 text-primary'
                        : 'bg-[var(--bg-raised)] text-[var(--fg-subtle)]',
                )}
            >
                {count}
            </span>
        </button>
    );
}
