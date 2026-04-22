import { useCallback, useRef, useState } from 'react';
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
        project?: ContentProject;
        log_entry?: GenerationLogEntry | null;
    };
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

export function useGenerationStream(): UseGenerationStreamReturn {
    const [status, setStatus] = useState<StreamStatus>('idle');
    const [message, setMessage] = useState('');
    const channelNameRef = useRef<string | null>(null);

    const cancel = useCallback(() => {
        if (channelNameRef.current) {
            echo().leave(channelNameRef.current);
            channelNameRef.current = null;
        }
        setStatus('idle');
        setMessage('');
    }, []);

    const startStream = useCallback(
        (
            projectId: string,
            jobId: string,
            onComplete: (project: ContentProject, logEntry: GenerationLogEntry | null) => void,
            onError: (message: string) => void,
        ) => {
            if (channelNameRef.current) {
                echo().leave(channelNameRef.current);
                channelNameRef.current = null;
            }

            const channelName = `content-studio.${projectId}`;
            channelNameRef.current = channelName;
            setStatus('processing');
            setMessage('Starting generation...');

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
                        const project = payload.data.project;
                        const logEntry = payload.data.log_entry ?? null;
                        echo().leave(channelName);
                        channelNameRef.current = null;
                        if (project) {
                            onComplete(project, logEntry);
                        }
                    } else if (payload.type === 'error') {
                        const errorMsg = payload.data.message ?? 'Unknown error';
                        setStatus('error');
                        setMessage(errorMsg);
                        echo().leave(channelName);
                        channelNameRef.current = null;
                        onError(errorMsg);
                    }
                });
        },
        [],
    );

    return { status, message, startStream, cancel };
}
