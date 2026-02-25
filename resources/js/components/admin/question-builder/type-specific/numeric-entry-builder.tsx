import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NumericEntryConfig } from '@/types/questions';

interface Props {
    value: NumericEntryConfig | null;
    onChange: (config: NumericEntryConfig) => void;
}

function getDefaults(): NumericEntryConfig {
    return {
        answer: 0,
        tolerance: undefined,
        unit: '',
    };
}

export default function NumericEntryBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function update(partial: Partial<NumericEntryConfig>) {
        onChange({ ...config, ...partial });
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="numeric_answer">Answer</Label>
                <Input
                    id="numeric_answer"
                    type="number"
                    step="any"
                    value={config.answer}
                    onChange={(e) => update({ answer: parseFloat(e.target.value) || 0 })}
                    placeholder="Numeric answer"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="numeric_tolerance">Tolerance (optional)</Label>
                    <Input
                        id="numeric_tolerance"
                        type="number"
                        step="any"
                        min={0}
                        value={config.tolerance ?? ''}
                        onChange={(e) =>
                            update({ tolerance: e.target.value ? parseFloat(e.target.value) : undefined })
                        }
                        placeholder="e.g. 0.5"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="numeric_unit">Unit (optional)</Label>
                    <Input
                        id="numeric_unit"
                        value={config.unit ?? ''}
                        onChange={(e) => update({ unit: e.target.value || undefined })}
                        placeholder="e.g. cm, kg"
                    />
                </div>
            </div>
        </div>
    );
}
