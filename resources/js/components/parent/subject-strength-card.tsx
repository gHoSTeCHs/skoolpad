import { BarChart3 } from 'lucide-react';
import type { SubjectStrength } from '@/types/parent';

interface SubjectStrengthCardProps {
    subjects: SubjectStrength[];
}

function getStatusClasses(status: SubjectStrength['status']): string {
    switch (status) {
        case 'strong':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'moderate':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        case 'weak':
            return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
        case 'not_started':
            return 'bg-muted text-muted-foreground';
    }
}

export function SubjectStrengthCard({ subjects }: SubjectStrengthCardProps) {
    return (
        <div className="h-full rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Subject Strength
                </h3>
            </div>

            {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subject data yet.</p>
            ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {subjects.map((subject) => (
                        <div
                            key={subject.level_subject_id}
                            className={`rounded-lg p-3 text-center ${getStatusClasses(subject.status)}`}
                        >
                            <span className="text-xs font-medium">{subject.subject_name}</span>
                            <div className="text-lg font-bold">
                                {subject.status === 'not_started' ? '—' : `${subject.performance_percentage}%`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
