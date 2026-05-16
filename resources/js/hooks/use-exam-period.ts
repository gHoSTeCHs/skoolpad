import { useCallback, useState } from 'react';
import { randomId } from '@/lib/utils';

export interface ExamPeriod {
    label: string;
    startDate: string;
    endDate: string;
}

export interface ExamPeriodEntry {
    id: string;
    date: string;
    time: string;
    courseCode: string;
    courseName: string;
    venue: string;
    notes: string;
}

export interface UseExamPeriodReturn {
    period: ExamPeriod | null;
    entries: ExamPeriodEntry[];
    setPeriod: (period: ExamPeriod | null) => void;
    addEntry: (entry: Omit<ExamPeriodEntry, 'id'>) => void;
    removeEntry: (id: string) => void;
    updateEntry: (id: string, updates: Partial<ExamPeriodEntry>) => void;
    entriesForDate: (dateKey: string) => ExamPeriodEntry[];
    isWithinPeriod: (dateKey: string) => boolean;
    isPeriodStart: (dateKey: string) => boolean;
    isPeriodEnd: (dateKey: string) => boolean;
    entryCountForDate: (dateKey: string) => number;
}

export function useExamPeriod(): UseExamPeriodReturn {
    const [period, setPeriod] = useState<ExamPeriod | null>(null);
    const [entries, setEntries] = useState<ExamPeriodEntry[]>([]);

    const addEntry = useCallback((entry: Omit<ExamPeriodEntry, 'id'>) => {
        const newEntry: ExamPeriodEntry = {
            ...entry,
            id: randomId(),
        };
        setEntries((prev) => [...prev, newEntry]);
    }, []);

    const removeEntry = useCallback((id: string) => {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
    }, []);

    const updateEntry = useCallback((id: string, updates: Partial<ExamPeriodEntry>) => {
        setEntries((prev) =>
            prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
        );
    }, []);

    const entriesForDate = useCallback(
        (dateKey: string): ExamPeriodEntry[] => {
            return entries.filter((entry) => entry.date === dateKey);
        },
        [entries],
    );

    const isWithinPeriod = useCallback(
        (dateKey: string): boolean => {
            if (!period) {
                return false;
            }
            return dateKey >= period.startDate && dateKey <= period.endDate;
        },
        [period],
    );

    const isPeriodStart = useCallback(
        (dateKey: string): boolean => {
            if (!period) {
                return false;
            }
            return dateKey === period.startDate;
        },
        [period],
    );

    const isPeriodEnd = useCallback(
        (dateKey: string): boolean => {
            if (!period) {
                return false;
            }
            return dateKey === period.endDate;
        },
        [period],
    );

    const entryCountForDate = useCallback(
        (dateKey: string): number => {
            return entries.filter((entry) => entry.date === dateKey).length;
        },
        [entries],
    );

    return {
        period,
        entries,
        setPeriod,
        addEntry,
        removeEntry,
        updateEntry,
        entriesForDate,
        isWithinPeriod,
        isPeriodStart,
        isPeriodEnd,
        entryCountForDate,
    };
}
