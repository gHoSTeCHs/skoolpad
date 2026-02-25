import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DiagramLabelConfig } from '@/types/questions';

interface Props {
    value: DiagramLabelConfig | null;
    onChange: (config: DiagramLabelConfig) => void;
}

function getDefaults(): DiagramLabelConfig {
    return {
        labels: [{ label: '', answer: '' }],
    };
}

export default function DiagramLabelBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function updateLabels(labels: DiagramLabelConfig['labels']) {
        onChange({ ...config, labels });
    }

    function addLabel() {
        updateLabels([...config.labels, { label: '', answer: '' }]);
    }

    function removeLabel(index: number) {
        if (config.labels.length <= 1) return;
        updateLabels(config.labels.filter((_, i) => i !== index));
    }

    function updateField(index: number, field: 'label' | 'answer', text: string) {
        const updated = config.labels.map((lbl, i) =>
            i === index ? { ...lbl, [field]: text } : lbl,
        );
        updateLabels(updated);
    }

    return (
        <div className="space-y-4">
            <Label>Labels</Label>

            {config.labels.map((lbl, index) => (
                <div key={index} className="flex items-center gap-3">
                    <Input
                        value={lbl.label}
                        onChange={(e) => updateField(index, 'label', e.target.value)}
                        placeholder={`Label ${index + 1} (e.g. A, 1, i)`}
                        className="w-40 shrink-0"
                    />

                    <Input
                        value={lbl.answer}
                        onChange={(e) => updateField(index, 'answer', e.target.value)}
                        placeholder="Answer text"
                        className="flex-1"
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLabel(index)}
                        disabled={config.labels.length <= 1}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Remove label {index + 1}</span>
                    </Button>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addLabel}>
                <Plus className="size-4" />
                Add Label
            </Button>
        </div>
    );
}
