import { AlertTriangle } from 'lucide-react';

interface StalenessIndicatorProps {
    lastCheckInDate: string | null;
}

function getDaysSince(dateString: string): number {
    const now = new Date();
    const then = new Date(`${dateString}T12:00:00`);
    return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function getMessage(days: number): string {
    if (days >= 30) {
        return `Last check-in: ${days} days ago. Readiness scores may not reflect current understanding.`;
    }
    if (days >= 14) {
        return `You haven\u2019t checked in for ${days} days. A quick 5-minute session tonight?`;
    }
    return `Last check-in was ${days} days ago.`;
}

function getIntensity(days: number): string {
    if (days >= 30) {
        return 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30';
    }
    if (days >= 14) {
        return 'border-amber-300 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/20';
    }
    return 'border-amber-200 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/10';
}

export function StalenessIndicator({ lastCheckInDate }: StalenessIndicatorProps) {
    if (!lastCheckInDate) {
        return null;
    }

    const days = getDaysSince(lastCheckInDate);

    if (days < 7) {
        return null;
    }

    return (
        <div role="alert" className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${getIntensity(days)}`}>
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <p className="text-sm text-foreground">{getMessage(days)}</p>
        </div>
    );
}
