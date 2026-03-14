import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { calculateRequiredGpa } from '@/lib/cgpa-calculator';
import type { ClassificationLabel } from '@/types/cgpa';
import { CheckCircle, Target, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ReverseCalculatorProps {
    currentCgpa: number;
    currentCredits: number;
    scaleMax: number;
    classificationLabels: ClassificationLabel[];
}

export function ReverseCalculator({
    currentCgpa,
    currentCredits,
    scaleMax,
    classificationLabels,
}: ReverseCalculatorProps) {
    const [targetCgpa, setTargetCgpa] = useState<string>('');
    const [remainingCredits, setRemainingCredits] = useState<string>('');

    const target = parseFloat(targetCgpa);
    const remaining = parseInt(remainingCredits);

    const hasValidInput = !isNaN(target) && target > 0 && !isNaN(remaining) && remaining > 0;

    const result = hasValidInput
        ? calculateRequiredGpa(currentCgpa, currentCredits, target, remaining, scaleMax)
        : null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="size-4 text-muted-foreground" />
                    Reverse Calculator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Find out what GPA you need to reach your target CGPA.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <FormField label="Target CGPA" name="target_cgpa">
                        <Input
                            id="target_cgpa"
                            type="number"
                            step="0.01"
                            min={0}
                            max={scaleMax}
                            placeholder={`0 – ${scaleMax}`}
                            value={targetCgpa}
                            onChange={(e) => setTargetCgpa(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Remaining Credits" name="remaining_credits">
                        <Input
                            id="remaining_credits"
                            type="number"
                            min={1}
                            max={500}
                            placeholder="e.g. 30"
                            value={remainingCredits}
                            onChange={(e) => setRemainingCredits(e.target.value)}
                        />
                    </FormField>
                </div>

                {classificationLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {classificationLabels.map((cl) => (
                            <Button
                                key={cl.label}
                                variant={parseFloat(targetCgpa) === cl.min_cgpa ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setTargetCgpa(cl.min_cgpa.toString())}
                            >
                                {cl.label}
                            </Button>
                        ))}
                    </div>
                )}

                {result && (
                    <div
                        className={`rounded-lg border p-4 ${
                            result.isAchievable
                                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 reader:border-emerald-800 reader:bg-emerald-950/30'
                                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 reader:border-red-800 reader:bg-red-950/30'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {result.isAchievable ? (
                                <CheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400 reader:text-emerald-400" />
                            ) : (
                                <XCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400 reader:text-red-400" />
                            )}
                            <div className="space-y-1">
                                {result.isAchievable && result.requiredGpa > 0 && (
                                    <p
                                        className="text-2xl font-bold"
                                        style={{ fontFamily: 'var(--font-display)' }}
                                    >
                                        {result.requiredGpa.toFixed(2)} GPA needed
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    {result.isAchievable
                                        ? result.requiredGpa > 0
                                            ? `You need a minimum GPA of ${result.requiredGpa.toFixed(2)} across your remaining ${remaining} credits to achieve a ${target.toFixed(2)} CGPA.`
                                            : 'You have already exceeded your target CGPA.'
                                        : `A GPA of ${result.requiredGpa.toFixed(2)} is required, which exceeds the maximum of ${scaleMax.toFixed(1)}. Consider adjusting your target.`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
