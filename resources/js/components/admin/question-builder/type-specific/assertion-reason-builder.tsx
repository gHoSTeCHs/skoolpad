import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AssertionReasonConfig } from '@/types/questions';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

interface Props {
    value: AssertionReasonConfig | null;
    onChange: (config: AssertionReasonConfig) => void;
}

function getDefaults(): AssertionReasonConfig {
    return {
        assertion: '',
        reason: '',
        options: [
            { label: 'A', text: 'Both A and R are true and R is the correct explanation of A', is_correct: false },
            { label: 'B', text: 'Both A and R are true but R is NOT the correct explanation of A', is_correct: false },
            { label: 'C', text: 'A is true but R is false', is_correct: false },
            { label: 'D', text: 'A is false but R is true', is_correct: false },
            { label: 'E', text: 'Both A and R are false', is_correct: false },
        ],
    };
}

export default function AssertionReasonBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function update(partial: Partial<AssertionReasonConfig>) {
        onChange({ ...config, ...partial });
    }

    function updateOptions(options: AssertionReasonConfig['options']) {
        update({ options });
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

    function updateOptionText(index: number, text: string) {
        const updated = config.options.map((opt, i) => (i === index ? { ...opt, text } : opt));
        updateOptions(updated);
    }

    function setCorrect(index: number) {
        const updated = config.options.map((opt, i) => ({ ...opt, is_correct: i === index }));
        updateOptions(updated);
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="assertion">Assertion</Label>
                <Textarea
                    id="assertion"
                    value={config.assertion}
                    onChange={(e) => update({ assertion: e.target.value })}
                    placeholder="Enter the assertion statement"
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                    id="reason"
                    value={config.reason}
                    onChange={(e) => update({ reason: e.target.value })}
                    placeholder="Enter the reason statement"
                    rows={3}
                />
            </div>

            <div className="space-y-3">
                <Label>Answer Options</Label>

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
                                type="radio"
                                name="assertion_reason_correct"
                                checked={option.is_correct}
                                onChange={() => setCorrect(index)}
                                className="accent-primary size-3.5"
                            />
                            <span className="text-sm font-semibold tabular-nums">{OPTION_LABELS[index]}</span>
                        </label>

                        <Input
                            value={option.text}
                            onChange={(e) => updateOptionText(index, e.target.value)}
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
        </div>
    );
}
