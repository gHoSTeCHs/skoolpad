import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AssessmentTypeResult } from '@/types/onboarding';

interface ExamGoalsStepProps {
    selectedIds: string[];
    assessmentTypes: AssessmentTypeResult[];
    loading: boolean;
    onToggle: (id: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function ExamGoalsStep({ selectedIds, assessmentTypes, loading, onToggle, onNext, onBack }: ExamGoalsStepProps) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="font-display text-xl font-bold tracking-tight">What exams are you preparing for?</h2>
                <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Select any exams you&apos;re working towards. You can skip this if you&apos;re not sure yet.
                </p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                    ))}
                </div>
            ) : assessmentTypes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No exams found for this education system.
                </p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {assessmentTypes.map((type) => {
                        const isSelected = selectedIds.includes(type.id);
                        return (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => onToggle(type.id)}
                                className={cn(
                                    'rounded-lg border-2 p-4 text-left transition-colors',
                                    isSelected
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                        : 'border-border hover:border-muted-foreground/30',
                                )}
                            >
                                <span className="block text-sm font-semibold">{type.name}</span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {type.is_exit_exam && type.is_entrance_exam
                                        ? 'Exit & Entrance exam'
                                        : type.is_exit_exam
                                            ? 'Exit exam'
                                            : 'Entrance exam'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Back</Button>
                <Button onClick={onNext} disabled={loading}>
                    {selectedIds.length === 0 ? 'Skip' : 'Continue'}
                </Button>
            </div>
        </div>
    );
}
