import { GraduationCap } from 'lucide-react';
import type { ExamReadiness } from '@/types/parent';

interface ReadinessCardProps {
    scores: ExamReadiness[];
}

function getScoreColor(score: number): string {
    if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function getBarColor(score: number): string {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}

export function ReadinessCard({ scores }: ReadinessCardProps) {
    return (
        <div className="h-full rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Exam Readiness
                </h3>
            </div>

            {scores.length === 0 ? (
                <p className="text-sm text-muted-foreground">No readiness data yet.</p>
            ) : (
                <div className="space-y-3">
                    {scores.map((score, index) => (
                        <div key={score.subject_name ?? index}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground">
                                    {score.subject_name ?? 'Unknown Subject'}
                                </span>
                                <span className={`text-sm font-bold ${getScoreColor(score.composite_score)}`}>
                                    {score.composite_score}%
                                </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${getBarColor(score.composite_score)}`}
                                    style={{ width: `${Math.min(100, score.composite_score)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
