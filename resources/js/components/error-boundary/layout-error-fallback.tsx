import { Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';

interface LayoutErrorFallbackProps {
    error: Error;
    reset: () => void;
    dashboardUrl?: string;
    dashboardLabel?: string;
}

export function LayoutErrorFallback({
    error,
    reset,
    dashboardUrl = '/dashboard',
    dashboardLabel = 'Go to Dashboard',
}: LayoutErrorFallbackProps) {
    return (
        <div className="flex flex-1 items-center justify-center p-4 md:p-6">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="size-6 text-destructive" />
                </div>

                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    This page couldn't load
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {import.meta.env.DEV
                        ? error.message
                        : 'An unexpected error occurred. Please try again.'}
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Try Again
                    </button>
                    <Link
                        href={dashboardUrl}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                        {dashboardLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}
