import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CurriculumTierResult } from '@/types/onboarding';

interface SecondaryLevelStepProps {
    value: string;
    tiers: CurriculumTierResult[];
    loading: boolean;
    onSelect: (levelId: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function SecondaryLevelStep({ value, tiers, loading, onSelect, onNext, onBack }: SecondaryLevelStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">What class are you in?</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Select your current class level.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
            ) : tiers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No class levels found for this education system.
                </p>
            ) : (
                <div className="space-y-5">
                    {tiers.map((tier) => (
                        <div key={tier.id}>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {tier.name}
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {tier.education_levels.map((level) => (
                                    <button
                                        key={level.id}
                                        type="button"
                                        onClick={() => onSelect(level.id)}
                                        className={cn(
                                            'rounded-lg border-2 p-4 text-left transition-colors',
                                            value === level.id
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                : 'border-border hover:border-muted-foreground/30',
                                        )}
                                    >
                                        <span className="block text-sm font-semibold">{level.display_name || level.name}</span>
                                        {level.typical_age_min && level.typical_age_max && (
                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                Ages {level.typical_age_min}–{level.typical_age_max}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
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
