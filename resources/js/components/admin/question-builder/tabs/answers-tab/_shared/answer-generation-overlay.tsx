'use no memo';

import { router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface AnswerGenerationOverlayProps {
    questionId: string;
    jobId: string;
    depthLabel: string;
    onDone: () => void;
    onError: (message: string) => void;
}

interface AnswerGenPayload {
    job_id: string;
    type: 'status' | 'complete' | 'error';
    data: {
        message?: string;
        generation_log_id?: string;
        depth?: string;
    };
}

const HUNG_TIMEOUT_MS = 5 * 60 * 1000;

export function AnswerGenerationOverlay({
    questionId,
    jobId,
    depthLabel,
    onDone,
    onError,
}: AnswerGenerationOverlayProps) {
    const channelName = `answers.${questionId}`;
    const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const teardownRef = useRef<(() => void) | null>(null);

    const teardown = useCallback(() => {
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        echo().leave(channelName);
    }, [channelName]);

    teardownRef.current = teardown;

    useEffect(() => {
        watchdogRef.current = setTimeout(() => {
            teardown();
            onError('Generation timed out. Reload the page to check status.');
        }, HUNG_TIMEOUT_MS);

        echo()
            .private(channelName)
            .listen('.AnswerGenerationUpdate', (payload: AnswerGenPayload) => {
                if (payload.job_id !== jobId) return;

                if (payload.type === 'complete') {
                    teardown();
                    router.reload({ only: ['paper'], onSuccess: () => onDone() });
                } else if (payload.type === 'error') {
                    teardown();
                    router.reload({
                        only: ['paper'],
                        onSuccess: () => onError(payload.data.message ?? 'Generation failed.'),
                    });
                }
            });

        return () => teardown();
    }, [channelName, jobId, teardown, onDone, onError]);

    return (
        <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-lg bg-[var(--bg-raised)] p-6 text-center">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
                Generating {depthLabel} answer&hellip;
            </p>
            <p className="text-[11.5px] text-muted-foreground">
                This takes a few seconds. The answer will appear here when ready.
            </p>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 gap-1.5 text-xs text-muted-foreground"
                onClick={() => {
                    teardown();
                    onError('Generation cancelled.');
                }}
            >
                <X className="size-3" />
                Cancel
            </Button>
        </div>
    );
}
