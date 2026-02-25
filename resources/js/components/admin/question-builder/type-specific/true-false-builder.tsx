import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { TrueFalseConfig } from '@/types/questions';

interface Props {
    value: TrueFalseConfig | null;
    onChange: (config: TrueFalseConfig) => void;
}

function getDefaults(): TrueFalseConfig {
    return {
        correct_answer: true,
        requires_justification: false,
    };
}

export default function TrueFalseBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function setCorrectAnswer(answer: boolean) {
        onChange({ ...config, correct_answer: answer });
    }

    function toggleJustification(checked: boolean) {
        onChange({ ...config, requires_justification: checked });
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Correct Answer</Label>
                <div className="flex gap-3">
                    {[true, false].map((answer) => (
                        <label
                            key={String(answer)}
                            className={cn(
                                'flex h-9 cursor-pointer items-center gap-2 rounded-md border px-4 transition-colors',
                                config.correct_answer === answer
                                    ? 'border-primary/40 bg-primary/5 text-primary'
                                    : 'border-input bg-background text-muted-foreground hover:border-ring/40',
                            )}
                        >
                            <input
                                type="radio"
                                name="true_false_correct"
                                checked={config.correct_answer === answer}
                                onChange={() => setCorrectAnswer(answer)}
                                className="accent-primary size-3.5"
                            />
                            <span className="text-sm font-medium">{answer ? 'True' : 'False'}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Switch
                    id="requires_justification"
                    checked={config.requires_justification ?? false}
                    onCheckedChange={toggleJustification}
                />
                <Label htmlFor="requires_justification">Requires justification</Label>
            </div>
        </div>
    );
}
