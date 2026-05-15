import { useCallback, useState } from 'react';
import { randomId } from '@/lib/utils';

export interface SessionPeriod {
    label: string;
    startDate: string;
    endDate: string;
}

export interface WeeklyScheduleSlot {
    id: string;
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    startTime: string;
    endTime: string;
    courseCode: string;
    courseName: string;
    venue: string;
}

export interface UseWeeklyScheduleReturn {
    session: SessionPeriod | null;
    template: WeeklyScheduleSlot[];
    setSession: (session: SessionPeriod | null) => void;
    addSlot: (slot: Omit<WeeklyScheduleSlot, 'id'>) => void;
    removeSlot: (id: string) => void;
    updateSlot: (id: string, updates: Partial<WeeklyScheduleSlot>) => void;
    slotsForDay: (dayOfWeek: number) => WeeklyScheduleSlot[];
    slotsForDate: (dateKey: string, examPeriodCheck?: (dateKey: string) => boolean) => WeeklyScheduleSlot[];
    isWithinSession: (dateKey: string) => boolean;
    slotCountForDate: (dateKey: string, examPeriodCheck?: (dateKey: string) => boolean) => number;
}

export function useWeeklySchedule(): UseWeeklyScheduleReturn {
    const [session, setSession] = useState<SessionPeriod | null>(null);
    const [template, setTemplate] = useState<WeeklyScheduleSlot[]>([]);

    const addSlot = useCallback((slot: Omit<WeeklyScheduleSlot, 'id'>) => {
        const newSlot: WeeklyScheduleSlot = {
            ...slot,
            id: randomId(),
        };
        setTemplate((prev) => [...prev, newSlot]);
    }, []);

    const removeSlot = useCallback((id: string) => {
        setTemplate((prev) => prev.filter((slot) => slot.id !== id));
    }, []);

    const updateSlot = useCallback((id: string, updates: Partial<WeeklyScheduleSlot>) => {
        setTemplate((prev) =>
            prev.map((slot) => (slot.id === id ? { ...slot, ...updates } : slot)),
        );
    }, []);

    const slotsForDay = useCallback(
        (dayOfWeek: number): WeeklyScheduleSlot[] => {
            return template
                .filter((slot) => slot.dayOfWeek === dayOfWeek)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
        },
        [template],
    );

    const isWithinSession = useCallback(
        (dateKey: string): boolean => {
            if (!session) {
                return false;
            }
            return dateKey >= session.startDate && dateKey <= session.endDate;
        },
        [session],
    );

    const slotsForDate = useCallback(
        (dateKey: string, examPeriodCheck?: (dateKey: string) => boolean): WeeklyScheduleSlot[] => {
            if (!session) {
                return [];
            }

            if (dateKey < session.startDate || dateKey > session.endDate) {
                return [];
            }

            if (examPeriodCheck && examPeriodCheck(dateKey)) {
                return [];
            }

            const date = new Date(dateKey + 'T00:00:00');
            const dayOfWeek = date.getDay();

            return template
                .filter((slot) => slot.dayOfWeek === dayOfWeek)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
        },
        [session, template],
    );

    const slotCountForDate = useCallback(
        (dateKey: string, examPeriodCheck?: (dateKey: string) => boolean): number => {
            if (!session) {
                return 0;
            }

            if (dateKey < session.startDate || dateKey > session.endDate) {
                return 0;
            }

            if (examPeriodCheck && examPeriodCheck(dateKey)) {
                return 0;
            }

            const date = new Date(dateKey + 'T00:00:00');
            const dayOfWeek = date.getDay();

            return template.filter((slot) => slot.dayOfWeek === dayOfWeek).length;
        },
        [session, template],
    );

    return {
        session,
        template,
        setSession,
        addSlot,
        removeSlot,
        updateSlot,
        slotsForDay,
        slotsForDate,
        isWithinSession,
        slotCountForDate,
    };
}
