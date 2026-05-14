import { useEffect } from 'react';
import { useBuilderStore } from '../store/provider';

/**
 * Registers an editable surface's dirty state into the builder store and
 * deregisters it on unmount. `reset` must be referentially stable
 * (wrap it in useCallback) — it is invoked by the store's confirmDiscard.
 */
export function useDirtyRegistration(key: string, isDirty: boolean, reset: () => void) {
    const registerDirty = useBuilderStore((s) => s.registerDirty);
    const unregisterDirty = useBuilderStore((s) => s.unregisterDirty);

    useEffect(() => {
        registerDirty(key, isDirty, reset);
    }, [key, isDirty, reset, registerDirty]);

    useEffect(() => {
        return () => unregisterDirty(key);
    }, [key, unregisterDirty]);
}
