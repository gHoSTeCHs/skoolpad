import { useEffect } from 'react';
import { useBuilderV4Store } from '../store/provider';

/**
 * Registers an editable surface's dirty state into the v4 builder store and
 * deregisters it on unmount. `reset` must be referentially stable
 * (wrap in useCallback) — the store invokes it during confirmDiscard.
 */
export function useDirtyRegistration(key: string, isDirty: boolean, reset: () => void) {
    const registerDirty = useBuilderV4Store((s) => s.registerDirty);
    const unregisterDirty = useBuilderV4Store((s) => s.unregisterDirty);

    useEffect(() => {
        registerDirty(key, isDirty, reset);
    }, [key, isDirty, reset, registerDirty]);

    useEffect(() => {
        return () => unregisterDirty(key);
    }, [key, unregisterDirty]);
}
