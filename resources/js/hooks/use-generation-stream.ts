import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import type { ContentProject, GenerationLogEntry } from '@/types/content-studio';

export type StreamStatus = 'idle' | 'processing' | 'validating' | 'complete' | 'error';

export type ProgressItemState = 'queued' | 'running' | 'done' | 'error';

export interface ProgressItem {
    id: string;
    kind: 'block' | 'topic' | 'project';
    state: ProgressItemState;
    message?: string;
    startedAt: number;
    completedAt?: number;
    generationLogId?: string | null;
}

/**
 * Broadcast event contract:
 * - status: stream-level state changes; per-item events when block_id is set.
 * - item_complete: per-block completion inside a topic-level run. DOES NOT finalize the stream.
 * - item_error: per-block failure inside a topic-level run. DOES NOT finalize the stream.
 * - complete: stream-end signal — finalizes via Inertia reload + onComplete.
 * - error: stream-level failure — finalizes via Inertia reload + onError.
 */
interface EventPayload {
    job_id: string;
    type: 'status' | 'complete' | 'error' | 'item_complete' | 'item_error';
    data: {
        stage?: string;
        state?: StreamStatus;
        message?: string;
        generation_log_id?: string | null;
        block_id?: string;
        topic_id?: string;
    };
}

interface ReloadedProps {
    project: ContentProject;
    generationLogs: GenerationLogEntry[];
}

interface UseGenerationStreamReturn {
    status: StreamStatus;
    message: string;
    progressItems: ProgressItem[];
    startStream: (
        projectId: string,
        jobId: string,
        onComplete: (project: ContentProject, logEntry: GenerationLogEntry | null) => void,
        onError: (message: string) => void,
    ) => void;
    cancel: () => void;
    reset: () => void;
}

const HUNG_JOB_TIMEOUT_MS = 5 * 60 * 1000;

function upsertItem(items: ProgressItem[], next: ProgressItem): ProgressItem[] {
    const idx = items.findIndex((i) => i.id === next.id);
    if (idx === -1) return [...items, next];
    const copy = items.slice();
    copy[idx] = {
        ...copy[idx],
        state: next.state,
        message: next.message ?? copy[idx].message,
        completedAt: next.completedAt ?? copy[idx].completedAt,
        generationLogId: next.generationLogId ?? copy[idx].generationLogId,
    };
    return copy;
}

export function useGenerationStream(): UseGenerationStreamReturn {
    const [status, setStatus] = useState<StreamStatus>('idle');
    const [message, setMessage] = useState('');
    const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
    const channelNameRef = useRef<string | null>(null);
    const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearWatchdog = useCallback(() => {
        if (watchdogRef.current) {
            clearTimeout(watchdogRef.current);
            watchdogRef.current = null;
        }
    }, []);

    const teardown = useCallback(() => {
        clearWatchdog();
        if (channelNameRef.current) {
            echo().leave(channelNameRef.current);
            channelNameRef.current = null;
        }
    }, [clearWatchdog]);

    const cancel = useCallback(() => {
        teardown();
        setStatus('idle');
        setMessage('');
    }, [teardown]);

    const reset = useCallback(() => {
        teardown();
        setStatus('idle');
        setMessage('');
        setProgressItems([]);
    }, [teardown]);

    const startStream = useCallback(
        (
            projectId: string,
            jobId: string,
            onComplete: (project: ContentProject, logEntry: GenerationLogEntry | null) => void,
            onError: (message: string) => void,
        ) => {
            teardown();
            setProgressItems([]);

            const channelName = `content-studio.${projectId}`;
            channelNameRef.current = channelName;
            setStatus('processing');
            setMessage('Starting generation...');

            watchdogRef.current = setTimeout(() => {
                if (channelNameRef.current !== channelName) return;
                const errorMsg = 'Lost connection to the generation job. Refresh the page to check status.';
                setStatus('error');
                setMessage(errorMsg);
                teardown();
                onError(errorMsg);
            }, HUNG_JOB_TIMEOUT_MS);

            echo()
                .private(channelName)
                .listen('.ContentGenerationUpdate', (payload: EventPayload) => {
                    if (payload.job_id !== jobId) return;

                    if (payload.type === 'status') {
                        if (payload.data.state) setStatus(payload.data.state);
                        if (payload.data.message !== undefined) setMessage(payload.data.message);

                        if (payload.data.block_id) {
                            setProgressItems((prev) =>
                                upsertItem(prev, {
                                    id: payload.data.block_id!,
                                    kind: 'block',
                                    state: 'running',
                                    message: payload.data.message,
                                    startedAt: Date.now(),
                                }),
                            );
                        }
                    } else if (payload.type === 'item_complete') {
                        if (payload.data.block_id) {
                            setProgressItems((prev) =>
                                upsertItem(prev, {
                                    id: payload.data.block_id!,
                                    kind: 'block',
                                    state: 'done',
                                    startedAt: Date.now(),
                                    completedAt: Date.now(),
                                    generationLogId: payload.data.generation_log_id ?? null,
                                }),
                            );
                        }
                    } else if (payload.type === 'item_error') {
                        if (payload.data.block_id) {
                            setProgressItems((prev) =>
                                upsertItem(prev, {
                                    id: payload.data.block_id!,
                                    kind: 'block',
                                    state: 'error',
                                    message: payload.data.message,
                                    startedAt: Date.now(),
                                    completedAt: Date.now(),
                                }),
                            );
                        }
                    } else if (payload.type === 'complete') {
                        setStatus('complete');
                        setMessage('');
                        teardown();

                        router.reload({
                            only: ['project', 'generationLogs', 'resolvedModels', 'topicsWithBlocks'],
                            onSuccess: (page) => {
                                const props = page.props as unknown as ReloadedProps;
                                const logEntry = props.generationLogs[0] ?? null;
                                onComplete(props.project, logEntry);
                            },
                        });
                    } else if (payload.type === 'error') {
                        const errorMsg = payload.data.message ?? 'Unknown error';
                        setStatus('error');
                        setMessage(errorMsg);
                        teardown();

                        router.reload({
                            only: ['project', 'generationLogs', 'resolvedModels', 'topicsWithBlocks'],
                            onSuccess: () => {
                                onError(errorMsg);
                            },
                        });
                    }
                });
        },
        [teardown],
    );

    useEffect(() => {
        return () => {
            teardown();
        };
    }, [teardown]);

    return { status, message, progressItems, startStream, cancel, reset };
}
