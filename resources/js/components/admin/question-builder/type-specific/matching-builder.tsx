import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MatchingConfig } from '@/types/questions';

const MIN_PAIRS = 2;

interface Props {
    value: MatchingConfig | null;
    onChange: (config: MatchingConfig) => void;
}

function getDefaults(): MatchingConfig {
    return {
        pairs: [
            { left: '', right: '' },
            { left: '', right: '' },
        ],
        distractors: [],
    };
}

export default function MatchingBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function updatePairs(pairs: MatchingConfig['pairs']) {
        onChange({ ...config, pairs });
    }

    function addPair() {
        updatePairs([...config.pairs, { left: '', right: '' }]);
    }

    function removePair(index: number) {
        if (config.pairs.length <= MIN_PAIRS) return;
        updatePairs(config.pairs.filter((_, i) => i !== index));
    }

    function updatePairField(index: number, field: 'left' | 'right', text: string) {
        const updated = config.pairs.map((pair, i) =>
            i === index ? { ...pair, [field]: text } : pair,
        );
        updatePairs(updated);
    }

    function updateDistractors(raw: string) {
        const distractors = raw.split(',').map((s) => s.trim()).filter(Boolean);
        onChange({ ...config, distractors });
    }

    function getDistractorsString(): string {
        return (config.distractors ?? []).join(', ');
    }

    return (
        <div className="space-y-4">
            <Label>Pairs</Label>

            {config.pairs.map((pair, index) => (
                <div key={index} className="flex items-center gap-3">
                    <Input
                        value={pair.left}
                        onChange={(e) => updatePairField(index, 'left', e.target.value)}
                        placeholder={`Left ${index + 1}`}
                        className="flex-1"
                    />

                    <span className="text-muted-foreground shrink-0 text-sm">&rarr;</span>

                    <Input
                        value={pair.right}
                        onChange={(e) => updatePairField(index, 'right', e.target.value)}
                        placeholder={`Right ${index + 1}`}
                        className="flex-1"
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removePair(index)}
                        disabled={config.pairs.length <= MIN_PAIRS}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Remove pair {index + 1}</span>
                    </Button>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addPair}>
                <Plus className="size-4" />
                Add Pair
            </Button>

            <div className="space-y-2">
                <Label htmlFor="distractors">Distractors (optional, comma-separated)</Label>
                <Input
                    id="distractors"
                    value={getDistractorsString()}
                    onChange={(e) => updateDistractors(e.target.value)}
                    placeholder="Extra items that don't match anything"
                />
            </div>
        </div>
    );
}
