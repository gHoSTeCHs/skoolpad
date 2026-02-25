import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FillBlankConfig } from '@/types/questions';

interface Props {
    value: FillBlankConfig | null;
    onChange: (config: FillBlankConfig) => void;
}

function getDefaults(): FillBlankConfig {
    return {
        blanks: [{ position: 1, correct_answers: [''] }],
        case_sensitive: false,
    };
}

export default function FillBlankBuilder({ value, onChange }: Props) {
    const config = value ?? getDefaults();

    function updateBlanks(blanks: FillBlankConfig['blanks']) {
        onChange({ ...config, blanks });
    }

    function addBlank() {
        const nextPosition = config.blanks.length > 0
            ? Math.max(...config.blanks.map((b) => b.position)) + 1
            : 1;
        updateBlanks([...config.blanks, { position: nextPosition, correct_answers: [''] }]);
    }

    function removeBlank(index: number) {
        if (config.blanks.length <= 1) return;
        updateBlanks(config.blanks.filter((_, i) => i !== index));
    }

    function updatePosition(index: number, position: number) {
        const updated = config.blanks.map((blank, i) =>
            i === index ? { ...blank, position } : blank,
        );
        updateBlanks(updated);
    }

    function updateAnswers(index: number, raw: string) {
        const correct_answers = raw.split(',').map((s) => s.trim()).filter(Boolean);
        const updated = config.blanks.map((blank, i) =>
            i === index ? { ...blank, correct_answers: correct_answers.length > 0 ? correct_answers : [''] } : blank,
        );
        updateBlanks(updated);
    }

    function getAnswersString(answers: string[]): string {
        return answers.join(', ');
    }

    function toggleCaseSensitive(checked: boolean) {
        onChange({ ...config, case_sensitive: checked });
    }

    return (
        <div className="space-y-4">
            <Label>Blanks</Label>

            {config.blanks.map((blank, index) => (
                <div key={index} className="flex items-center gap-3">
                    <div className="w-20 shrink-0">
                        <Input
                            type="number"
                            min={1}
                            value={blank.position}
                            onChange={(e) => updatePosition(index, parseInt(e.target.value, 10) || 1)}
                            placeholder="Pos"
                        />
                    </div>

                    <Input
                        value={getAnswersString(blank.correct_answers)}
                        onChange={(e) => updateAnswers(index, e.target.value)}
                        placeholder="Correct answers (comma-separated)"
                        className="flex-1"
                    />

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeBlank(index)}
                        disabled={config.blanks.length <= 1}
                    >
                        <X className="size-4" />
                        <span className="sr-only">Remove blank {index + 1}</span>
                    </Button>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addBlank}>
                <Plus className="size-4" />
                Add Blank
            </Button>

            <div className="flex items-center gap-3">
                <Switch
                    id="case_sensitive"
                    checked={config.case_sensitive ?? false}
                    onCheckedChange={toggleCaseSensitive}
                />
                <Label htmlFor="case_sensitive">Case sensitive</Label>
            </div>
        </div>
    );
}
