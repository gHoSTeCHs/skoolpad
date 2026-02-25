import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MultiSelectMcqConfig } from '@/types/questions';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

interface Props {
    value: MultiSelectMcqConfig | null;
    onChange: (config: MultiSelectMcqConfig) => void;
}

function getDefaults(): MultiSelectMcqConfig {
    return {
        options: [
            { label: 'A', text: '', is_correct: false },
            { label: 'B', text: '', is_correct: false },
        ],
        min_correct: 2,
    };
}

export default function MultiSelectMcqBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function updateOptions(options: MultiSelectMcqConfig['options']) {
        onChange({ ...config, options });
    }

    function addOption() {
        if (config.options.length >= MAX_OPTIONS) return;
        const label = OPTION_LABELS[config.options.length];
        updateOptions([...config.options, { label, text: '', is_correct: false }]);
    }

    function removeOption(index: number) {
        if (config.options.length <= MIN_OPTIONS) return;
        const updated = config.options
            .filter((_, i) => i !== index)
            .map((opt, i) => ({ ...opt, label: OPTION_LABELS[i] }));
        updateOptions(updated);
    }

    function updateText(index: number, text: string) {
        const updated = config.options.map((opt, i) => (i === index ? { ...opt, text } : opt));
        updateOptions(updated);
    }

    function toggleCorrect(index: number) {
        const updated = config.options.map((opt, i) =>
            i === index ? { ...opt, is_correct: !opt.is_correct } : opt,
        );
        updateOptions(updated);
    }

    return (
        <div className="space-y-3">
            <Label>Options (select all correct answers)</Label>

            {config.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                    <label
                        className={cn(
                            'flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 transition-colors',
                            option.is_correct
                                ? 'border-primary/40 bg-primary/5 text-primary'
                                : 'border-input bg-background text-muted-foreground hover:border-ring/40',
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={option.is_correct}
                            onChange={() => toggleCorrect(index)}
                            className="accent-primary size-3.5"
                        />
                        <span className="text-sm font-semibold tabular-nums">{OPTION_LABELS[index]}</span>
                    </label>

                    <Input
                        value={option.text}
                        onChange={(e) => updateText(index, e.target.value)}
                        placeholder={`Option ${OPTION_LABELS[index]}`}
                        className="flex-1"
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeOption(index)}
                        disabled={config.options.length <= MIN_OPTIONS}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Remove option {OPTION_LABELS[index]}</span>
                    </Button>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={config.options.length >= MAX_OPTIONS}
            >
                <Plus className="size-4" />
                Add Option
            </Button>
        </div>
    );
}
