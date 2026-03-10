export type * from './auth';
export type * from './enums';
export type * from './models';
export type * from './navigation';
export type * from './onboarding';
export type * from './questions';
export type * from './student-courses';
export type * from './student-questions';
export type * from './student-topics';
export type * from './practice';
export type * from './exam-timetable';
export type * from './study-planner';
export type * from './ui';

import type { Appearance } from '@/hooks/use-appearance';
import type { Auth } from './auth';

export type Flash = {
    success?: string | null;
    error?: string | null;
    importErrors?: string[] | null;
};

export type SharedData = {
    name: string;
    auth: Auth;
    appearance: Appearance;
    sidebarOpen: boolean;
    flash: Flash;
    [key: string]: unknown;
};
