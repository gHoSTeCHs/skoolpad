import { AlertTriangle } from 'lucide-react';

interface ComponentErrorFallbackProps {
    error: Error;
    reset: () => void;
}

export function ComponentErrorFallback({ reset }: ComponentErrorFallbackProps) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <AlertTriangle className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Failed to load</span>
            <button
                onClick={reset}
                className="ml-auto text-sm font-medium text-primary hover:underline"
            >
                Retry
            </button>
        </div>
    );
}
