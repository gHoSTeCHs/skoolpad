import { useCallback, useRef, useState } from 'react';
import type { ContentProject, GenerationLogEntry } from '@/types/content-studio';

export type StreamStatus = 'idle' | 'processing' | 'validating' | 'complete' | 'error';

interface CompleteData {
    stage: string;
    project: ContentProject;
    log_entry: GenerationLogEntry | null;
}

interface StatusData {
    stage: string;
    state: StreamStatus;
    message: string;
}

interface ErrorData {
    stage: string;
    message: string;
}

interface UseGenerationStreamReturn {
    status: StreamStatus;
    message: string;
    startStream: (
        url: string,
        onComplete: (project: ContentProject, logEntry: GenerationLogEntry | null) => void,
        onError: (message: string) => void,
    ) => void;
    cancel: () => void;
}

export function useGenerationStream(): UseGenerationStreamReturn {
    const [status, setStatus] = useState<StreamStatus>('idle');
    const [message, setMessage] = useState('');
    const sourceRef = useRef<EventSource | null>(null);

    const cancel = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.close();
            sourceRef.current = null;
        }
        setStatus('idle');
        setMessage('');
    }, []);

    const startStream = useCallback(
        (
            url: string,
            onComplete: (project: ContentProject, logEntry: GenerationLogEntry | null) => void,
            onError: (message: string) => void,
        ) => {
            cancel();

            const source = new EventSource(url);
            sourceRef.current = source;
            setStatus('processing');
            setMessage('Starting generation...');

            source.addEventListener('status', (e: MessageEvent) => {
                const data: StatusData = JSON.parse(e.data);
                setStatus(data.state);
                setMessage(data.message);
            });

            source.addEventListener('complete', (e: MessageEvent) => {
                const data: CompleteData = JSON.parse(e.data);
                setStatus('complete');
                setMessage('');
                source.close();
                sourceRef.current = null;
                onComplete(data.project, data.log_entry);
            });

            source.addEventListener('error', (e: MessageEvent) => {
                if (e.data) {
                    const data: ErrorData = JSON.parse(e.data);
                    setStatus('error');
                    setMessage(data.message);
                    onError(data.message);
                } else {
                    setStatus('error');
                    setMessage('Connection lost');
                    onError('Connection to server lost. Check if the generation completed.');
                }
                source.close();
                sourceRef.current = null;
            });
        },
        [cancel],
    );

    return { status, message, startStream, cancel };
}
