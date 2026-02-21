import { useCallback, useRef } from 'react';
import { slugify } from '@/lib/slug';

export type UseSlugReturn = {
    readonly generateSlug: (value: string) => string;
    readonly slugManuallyEdited: React.RefObject<boolean>;
    readonly resetSlugTracking: () => void;
};

/**
 * Hook for managing automatic slug generation with manual edit tracking.
 *
 * Provides slug generation functionality and tracks whether the user has
 * manually edited the slug field to prevent unwanted auto-updates.
 *
 * @returns Object containing generateSlug function, manual edit tracking ref, and reset function
 *
 * @example
 * const { generateSlug, slugManuallyEdited } = useSlug();
 *
 * function handleNameChange(value: string) {
 *     form.setData('name', value);
 *     if (!slugManuallyEdited.current) {
 *         form.setData('slug', generateSlug(value));
 *     }
 * }
 *
 * function handleSlugChange(value: string) {
 *     slugManuallyEdited.current = true;
 *     form.setData('slug', value);
 * }
 */
export function useSlug(): UseSlugReturn {
    const slugManuallyEdited = useRef(false);

    const generateSlug = useCallback((value: string): string => {
        return slugify(value);
    }, []);

    const resetSlugTracking = useCallback(() => {
        slugManuallyEdited.current = false;
    }, []);

    return { generateSlug, slugManuallyEdited, resetSlugTracking } as const;
}
