export type * from './auth';
export type * from './navigation';
export type * from './ui';

import type { Appearance } from '@/hooks/use-appearance';
import type { Auth } from './auth';

export type SharedData = {
    name: string;
    auth: Auth;
    appearance: Appearance;
    sidebarOpen: boolean;
    [key: string]: unknown;
};
