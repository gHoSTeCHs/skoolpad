import { router } from '@inertiajs/react';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark' | 'reader';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const listeners = new Set<() => void>();
let currentAppearance: Appearance = 'system';

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') return 'system';

    return (localStorage.getItem('appearance') as Appearance) || 'system';
};

const resolveAppearance = (appearance: Appearance): ResolvedAppearance => {
    if (appearance === 'reader') return 'reader';
    if (appearance === 'dark') return 'dark';
    if (appearance === 'system') return prefersDark() ? 'dark' : 'light';
    return 'light';
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') return;

    const resolved = resolveAppearance(appearance);

    document.documentElement.classList.remove('dark', 'reader');

    if (resolved === 'dark') {
        document.documentElement.classList.add('dark');
    } else if (resolved === 'reader') {
        document.documentElement.classList.add('reader');
    }

    document.documentElement.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') return null;

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => {
    applyTheme(currentAppearance);
    notify();
};

const syncToServer = (mode: Appearance): void => {
    if (typeof document === 'undefined') return;

    const isAuthenticated = document.cookie.split(';').some((c) => c.trim().startsWith('laravel_session=')) ||
        document.querySelector('meta[name="csrf-token"]') !== null;

    if (isAuthenticated) {
        router.patch('/settings/appearance', { appearance: mode }, {
            preserveState: true,
            preserveScroll: true,
        });
    }
};

export function initializeTheme(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem('appearance')) {
        localStorage.setItem('appearance', 'system');
        setCookie('appearance', 'system');
    }

    currentAppearance = getStoredAppearance();
    applyTheme(currentAppearance);

    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

export function useAppearance(): UseAppearanceReturn {
    const appearance: Appearance = useSyncExternalStore(
        subscribe,
        () => currentAppearance,
        () => 'system',
    );

    const resolvedAppearance: ResolvedAppearance = useMemo(
        () => resolveAppearance(appearance),
        [appearance],
    );

    const updateAppearance = useCallback((mode: Appearance): void => {
        currentAppearance = mode;

        localStorage.setItem('appearance', mode);

        setCookie('appearance', mode);

        applyTheme(mode);
        notify();

        syncToServer(mode);
    }, []);

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
