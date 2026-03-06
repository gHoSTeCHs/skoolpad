import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface TimerDisplayProps {
    totalSeconds: number;
    onTimeUp: () => void;
    isRunning: boolean;
}

export function TimerDisplay({ totalSeconds, onTimeUp, isRunning }: TimerDisplayProps) {
    const [remaining, setRemaining] = useState(totalSeconds);
    const onTimeUpRef = useRef(onTimeUp);
    onTimeUpRef.current = onTimeUp;

    const handleTimeUp = useCallback(() => {
        onTimeUpRef.current();
    }, []);

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, handleTimeUp]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const isLow = remaining < 60;

    return (
        <span className={cn('font-mono text-sm font-bold tabular-nums', isLow ? 'text-destructive animate-pulse' : 'text-muted-foreground')}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
    );
}
