import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { CalculationConfig } from '@/types/questions';

interface Props {
    value: CalculationConfig | null;
    onChange: (config: CalculationConfig) => void;
}

function getDefaults(): CalculationConfig {
    return {
        answer: '',
        unit: '',
        tolerance: undefined,
        requires_working: false,
    };
}

export default function CalculationBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function update(partial: Partial<CalculationConfig>) {
        onChange({ ...config, ...partial });
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="calc_answer">Answer</Label>
                <Input
                    id="calc_answer"
                    value={config.answer}
                    onChange={(e) => update({ answer: e.target.value })}
                    placeholder="Expected answer"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="calc_unit">Unit (optional)</Label>
                    <Input
                        id="calc_unit"
                        value={config.unit ?? ''}
                        onChange={(e) => update({ unit: e.target.value || undefined })}
                        placeholder="e.g. m/s, kg, N"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="calc_tolerance">Tolerance (optional)</Label>
                    <Input
                        id="calc_tolerance"
                        type="number"
                        step="any"
                        min={0}
                        value={config.tolerance ?? ''}
                        onChange={(e) =>
                            update({ tolerance: e.target.value ? parseFloat(e.target.value) : undefined })
                        }
                        placeholder="e.g. 0.01"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Switch
                    id="requires_working"
                    checked={config.requires_working ?? false}
                    onCheckedChange={(checked) => update({ requires_working: checked })}
                />
                <Label htmlFor="requires_working">Requires working/steps</Label>
            </div>
        </div>
    );
}
