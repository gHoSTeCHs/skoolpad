import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LevelStepProps {
    value: string;
    onSelect: (level: string) => void;
    onNext: () => void;
    onBack: () => void;
}

const levels = [
    { value: '100', label: '100 Level', description: 'First year' },
    { value: '200', label: '200 Level', description: 'Second year' },
    { value: '300', label: '300 Level', description: 'Third year' },
    { value: '400', label: '400 Level', description: 'Fourth year' },
    { value: '500', label: '500 Level', description: 'Fifth year' },
];

export default function LevelStep({ value, onSelect, onNext, onBack }: LevelStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">What level are you in?</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    This helps us suggest the right courses for you.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {levels.map((level) => (
                    <button
                        key={level.value}
                        type="button"
                        onClick={() => onSelect(level.value)}
                        className={cn(
                            'rounded-lg border-2 p-4 text-left transition-colors',
                            value === level.value
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:border-muted-foreground/30',
                        )}
                    >
                        <span className="block text-sm font-semibold">{level.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{level.description}</span>
                    </button>
                ))}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={!value}>Continue</Button>
            </div>
        </div>
    );
}
