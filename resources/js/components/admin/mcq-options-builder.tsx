import { Plus, X } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { QuestionOption } from '@/types/questions';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

interface McqOptionsBuilderProps {
    options: QuestionOption[];
    onChange: (options: QuestionOption[]) => void;
    errors?: Record<string, string>;
}

export function McqOptionsBuilder({ options, onChange, errors }: McqOptionsBuilderProps) {
    function addOption() {
        if (options.length >= MAX_OPTIONS) return;
        onChange([...options, { content: '', is_correct: false }]);
    }

    function removeOption(index: number) {
        if (options.length <= MIN_OPTIONS) return;
        const updated = options.filter((_, i) => i !== index);
        if (options[index].is_correct && updated.length > 0) {
            updated[0] = { ...updated[0], is_correct: true };
        }
        onChange(updated);
    }

    function updateContent(index: number, content: string) {
        const updated = options.map((opt, i) => (i === index ? { ...opt, content } : opt));
        onChange(updated);
    }

    function setCorrect(index: number) {
        const updated = options.map((opt, i) => ({ ...opt, is_correct: i === index }));
        onChange(updated);
    }

    return (
        <div className="space-y-3">
            {options.map((option, index) => (
                <div key={index} className="flex items-start gap-3">
                    <label
                        className={cn(
                            'flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 transition-colors',
                            option.is_correct
                                ? 'border-primary/40 bg-primary/5 text-primary'
                                : 'border-input bg-background text-muted-foreground hover:border-ring/40',
                        )}
                    >
                        <input
                            type="radio"
                            name="mcq_correct_option"
                            checked={option.is_correct}
                            onChange={() => setCorrect(index)}
                            className="accent-primary size-3.5"
                        />
                        <span className="text-sm font-semibold tabular-nums">{OPTION_LABELS[index]}</span>
                    </label>

                    <div className="min-w-0 flex-1 space-y-1">
                        <Input
                            value={option.content}
                            onChange={(e) => updateContent(index, e.target.value)}
                            placeholder={`Option ${OPTION_LABELS[index]}`}
                            aria-invalid={!!errors?.[`options.${index}.content`]}
                        />
                        <InputError message={errors?.[`options.${index}.content`]} />
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= MIN_OPTIONS}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Remove option {OPTION_LABELS[index]}</span>
                    </Button>
                </div>
            ))}

            <InputError message={errors?.options} />

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={options.length >= MAX_OPTIONS}
            >
                <Plus className="size-4" />
                Add Option
            </Button>
        </div>
    );
}
