import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClozeConfig } from '@/types/questions';

interface Props {
    value: ClozeConfig | null;
    onChange: (config: ClozeConfig) => void;
}

function getDefaults(): ClozeConfig {
    return {
        gaps: [{ position: 1, options: ['', ''], correct: 0 }],
    };
}

export default function ClozeBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function updateGaps(gaps: ClozeConfig['gaps']) {
        onChange({ ...config, gaps });
    }

    function addGap() {
        const nextPosition = config.gaps.length > 0
            ? Math.max(...config.gaps.map((g) => g.position)) + 1
            : 1;
        updateGaps([...config.gaps, { position: nextPosition, options: ['', ''], correct: 0 }]);
    }

    function removeGap(index: number) {
        if (config.gaps.length <= 1) return;
        updateGaps(config.gaps.filter((_, i) => i !== index));
    }

    function updatePosition(index: number, position: number) {
        const updated = config.gaps.map((gap, i) =>
            i === index ? { ...gap, position } : gap,
        );
        updateGaps(updated);
    }

    function updateGapOptions(index: number, raw: string) {
        const options = raw.split(',').map((s) => s.trim());
        const gap = config.gaps[index];
        const correct = gap.correct >= options.length ? 0 : gap.correct;
        const updated = config.gaps.map((g, i) =>
            i === index ? { ...g, options, correct } : g,
        );
        updateGaps(updated);
    }

    function getOptionsString(options: string[]): string {
        return options.join(', ');
    }

    function updateCorrect(index: number, correct: number) {
        const updated = config.gaps.map((gap, i) =>
            i === index ? { ...gap, correct } : gap,
        );
        updateGaps(updated);
    }

    return (
        <div className="space-y-4">
            <Label>Gaps</Label>

            {config.gaps.map((gap, index) => (
                <div key={index} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-20 shrink-0">
                            <Input
                                type="number"
                                min={1}
                                value={gap.position}
                                onChange={(e) => updatePosition(index, parseInt(e.target.value, 10) || 1)}
                                placeholder="Pos"
                            />
                        </div>

                        <Input
                            value={getOptionsString(gap.options)}
                            onChange={(e) => updateGapOptions(index, e.target.value)}
                            placeholder="Options (comma-separated)"
                            className="flex-1"
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeGap(index)}
                            disabled={config.gaps.length <= 1}
                        >
                            <X className="size-4" />
                            <span className="sr-only">Remove gap {index + 1}</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label className="shrink-0 text-xs">Correct:</Label>
                        <Select
                            value={String(gap.correct)}
                            onValueChange={(v) => updateCorrect(index, parseInt(v, 10))}
                        >
                            <SelectTrigger className="h-8 w-40">
                                <SelectValue placeholder="Select correct" />
                            </SelectTrigger>
                            <SelectContent>
                                {gap.options.map((opt, optIdx) => (
                                    <SelectItem key={optIdx} value={String(optIdx)}>
                                        {opt || `Option ${optIdx + 1}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addGap}>
                <Plus className="size-4" />
                Add Gap
            </Button>
        </div>
    );
}
