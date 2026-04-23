import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, CircleDot, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreamStatus } from '@/hooks/use-generation-stream';

interface GenerationProgressProps {
    status: StreamStatus;
    message: string;
    className?: string;
}

function formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function StatusIcon({ status }: { status: StreamStatus }) {
    if (status === 'processing') {
        return (
            <div
                className="size-3.5 rounded-full bg-primary"
                style={{ animation: 'status-pulse 1.5s ease-in-out infinite' }}
            />
        );
    }

    if (status === 'validating') {
        return <ShieldCheck className="size-4 animate-spin text-primary" />;
    }

    if (status === 'complete') {
        return (
            <div style={{ animation: 'status-check-in 0.4s ease-out forwards' }}>
                <Check className="size-4 text-[var(--success)]" />
            </div>
        );
    }

    if (status === 'error') {
        return <AlertTriangle className="size-4 text-destructive" />;
    }

    return <CircleDot className="size-3.5 text-muted-foreground" />;
}

export function GenerationProgress({ status, message, className }: GenerationProgressProps) {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedRef = useRef(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (status === 'processing' && !startedRef.current) {
            startedRef.current = true;
            setElapsed(0);
            setDismissed(false);
            intervalRef.current = setInterval(() => {
                setElapsed((prev) => prev + 1);
            }, 1000);
        }

        if (status === 'complete' || status === 'error') {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        if (status === 'complete') {
            const timeout = setTimeout(() => {
                setDismissed(true);
                startedRef.current = false;
            }, 1500);
            return () => clearTimeout(timeout);
        }

        if (status === 'idle') {
            startedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return undefined;
    }, [status]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    if (status === 'idle' || dismissed) {
        return null;
    }

    const borderAnimation =
        status === 'complete'
            ? 'generation-border-success 0.6s ease-out forwards'
            : status === 'error'
              ? 'generation-border-error 2s ease-in-out infinite'
              : 'generation-border 2s ease-in-out infinite';

    return (
        <div
            className={cn(
                'relative rounded-lg border-2 bg-card/50 px-4 py-3 transition-colors duration-300',
                status === 'error' && 'bg-destructive/5',
                className,
            )}
            style={{ animation: borderAnimation }}
        >
            <div className="flex items-center gap-3">
                <div className="flex shrink-0 items-center justify-center">
                    <StatusIcon status={status} />
                </div>
                <p
                    className={cn(
                        'min-w-0 flex-1 text-sm',
                        status === 'error'
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                    )}
                >
                    {message || 'Starting generation...'}
                </p>
                <span className="shrink-0 font-mono text-xs text-muted-foreground/60">
                    {formatElapsed(elapsed)}
                </span>
            </div>
        </div>
    );
}
