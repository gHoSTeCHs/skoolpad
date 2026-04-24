import { useCallback, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import type { ContentProject, GenerationLogEntry } from '@/types/content-studio';

export type StreamStatus = 'idle' | 'processing' | 'validating' | 'complete' | 'error';

interface EventPayload {
    job_id: string;
    type: 'status' | 'complete' | 'error';
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
    startStream: (
        projectId: string,
        jobId: string,
        onComplete: (project: ContentProject, logEntry: GenerationLogEntry | null) => void,
        onError: (message: string) => void,
    ) => void;
    cancel: () => void;
}

const HUNG_JOB_TIMEOUT_MS = 5 * 60 * 1000;

export function useGenerationStream(): UseGenerationStreamReturn {
    const [status, setStatus] = useState<StreamStatus>('idle');
    const [message, setMessage] = useState('');
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

    const startStream = useCallback(
        (
            projectId: string,
            jobId: string,
            onComplete: (project: ContentProject, logEntry: GenerationLogEntry | null) => void,
            onError: (message: string) => void,
        ) => {
            teardown();

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

    return { status, message, startStream, cancel };
}
