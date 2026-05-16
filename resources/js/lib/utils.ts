import type { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Formats a date string using Nigerian locale
 * @example formatDate('2024-02-15T10:30:00Z') => 'Feb 15, 2024'
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

/**
 * Formats a duration in minutes into a human-readable string (e.g. "1h 30m", "45m")
 * @example formatMinutes(90) => '1h 30m'
 */
export function formatMinutes(minutes: number | null): string {
    if (!minutes) return '—';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function stripHtml(html: string): string {
    if (typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generates a v4-style UUID for client-only use (React keys, draft IDs).
 * Prefers crypto.randomUUID, falls back to crypto.getRandomValues, then Math.random.
 *
 * crypto.randomUUID is only defined on secure contexts (HTTPS or http://localhost);
 * dev servers bound to ::1 or non-localhost hosts otherwise crash.
 */
export function randomId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex: string[] = [];
        for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, '0'));
        return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function csrfFetch(url: string, init?: RequestInit): Promise<Response> {
    const token = decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
    return fetch(url, {
        ...init,
        headers: {
            'X-XSRF-TOKEN': token,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });
}
