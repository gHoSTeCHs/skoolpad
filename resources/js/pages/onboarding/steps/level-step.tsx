import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LevelStepProps {
    value: string;
    levelProgression: string[];
    loading: boolean;
    onSelect: (level: string) => void;
    onNext: () => void;
    onBack: () => void;
}

const fallbackLevels = ['100', '200', '300', '400', '500'];

function getLevelDescription(level: string): string {
    const num = parseInt(level, 10);
    if (isNaN(num)) return level;
    const year = num / 100;
    const suffixes: Record<number, string> = { 1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Fifth', 6: 'Sixth', 7: 'Seventh' };
    return `${suffixes[year] ?? `Year ${year}`} year`;
}

export default function LevelStep({ value, levelProgression, loading, onSelect, onNext, onBack }: LevelStepProps) {
    const levels = levelProgression.length > 0 ? levelProgression : fallbackLevels;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">What level are you in?</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    This helps us suggest the right courses for you.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {levels.map((level) => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => onSelect(level)}
                            className={cn(
                                'rounded-lg border-2 p-4 text-left transition-colors',
                                value === level
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-border hover:border-muted-foreground/30',
                            )}
                        >
                            <span className="block text-sm font-semibold">{level} Level</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">{getLevelDescription(level)}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={!value || loading}>Continue</Button>
            </div>
        </div>
    );
}
