import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { classifyCgpa } from '@/lib/cgpa-calculator';
import type { ClassificationLabel } from '@/types/cgpa';

interface ResultsPanelProps {
    projectedCgpa: number;
    currentCgpa: number;
    scaleMax: number;
    classificationLabels: ClassificationLabel[];
    newCredits: number;
}

function getClassificationColor(classification: string | null): string {
    if (!classification) return 'bg-muted text-muted-foreground';

    const lower = classification.toLowerCase();
    if (lower.includes('first') || lower.includes('distinction')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 reader:bg-emerald-900/40 reader:text-emerald-300';
    if (lower.includes('upper') || lower.includes('second class upper')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 reader:bg-blue-900/40 reader:text-blue-300';
    if (lower.includes('lower') || lower.includes('second class lower')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 reader:bg-amber-900/40 reader:text-amber-300';
    if (lower.includes('third')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 reader:bg-orange-900/40 reader:text-orange-300';
    if (lower.includes('pass')) return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300 reader:bg-gray-800/40 reader:text-gray-300';

    return 'bg-muted text-muted-foreground';
}

export function ResultsPanel({ projectedCgpa, currentCgpa, scaleMax, classificationLabels, newCredits }: ResultsPanelProps) {
    const classification = classifyCgpa(projectedCgpa, classificationLabels);
    const progressPercent = scaleMax > 0 ? (projectedCgpa / scaleMax) * 100 : 0;
    const diff = projectedCgpa - currentCgpa;
    const hasInput = newCredits > 0;

    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <div className="text-center">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Projected CGPA
                    </p>
                    <p
                        className="mt-1 text-5xl font-bold tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {hasInput ? projectedCgpa.toFixed(2) : '—'}
                    </p>
                    {hasInput && classification && (
                        <Badge className={`mt-2 ${getClassificationColor(classification)}`}>
                            {classification}
                        </Badge>
                    )}
                </div>

                {hasInput && (
                    <>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0.00</span>
                                <span>{scaleMax.toFixed(1)}</span>
                            </div>
                            <Progress value={Math.min(progressPercent, 100)} />
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-3">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Current</p>
                                <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                    {currentCgpa.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Change</p>
                                <p
                                    className={`text-lg font-semibold ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400' : diff < 0 ? 'text-red-600 dark:text-red-400 reader:text-red-400' : 'text-muted-foreground'}`}
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {diff > 0 ? '+' : ''}
                                    {diff.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Projected</p>
                                <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                    {projectedCgpa.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {!hasInput && (
                    <p className="text-center text-sm text-muted-foreground">
                        Add courses and grades to see your projected CGPA.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
