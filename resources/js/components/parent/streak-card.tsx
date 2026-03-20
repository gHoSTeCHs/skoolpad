import { Flame } from 'lucide-react';
import type { StreakData } from '@/types/parent';

interface StreakCardProps {
    streak: StreakData | null;
}

export function StreakCard({ streak }: StreakCardProps) {
    const currentStreak = streak?.current_streak ?? 0;
    const longestStreak = streak?.longest_streak ?? 0;
    const calendar = streak?.calendar ?? [];
    const last28 = calendar.slice(-28);

    return (
        <div className="h-full rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
                <Flame className="size-4 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Study Streak
                </h3>
            </div>

            {!streak ? (
                <p className="text-sm text-muted-foreground">No streak data yet.</p>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Longest: {longestStreak} days</p>
                        <div className="flex items-center gap-1">
                            <Flame
                                className={`size-4 ${currentStreak > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}
                            />
                            <span className="text-sm font-bold">{currentStreak}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {last28.map((entry) => (
                            <div
                                key={entry.date}
                                title={entry.date}
                                className={`aspect-square rounded-sm ${
                                    entry.had_activity
                                        ? 'bg-[var(--canopy-500)]'
                                        : 'bg-muted/50'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
