import { useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { selectIsAnyDirty } from './store/create-store';
import { useBuilderV4Store } from './store/provider';

export function SaveBar() {
    const dirty = useBuilderV4Store(selectIsAnyDirty);
    /**
     * Subscribe to the registry object itself (stable ref between content changes),
     * not a derived array — derived arrays trip useSyncExternalStore's snapshot
     * comparison and re-render in a loop.
     */
    const dirtyRegistry = useBuilderV4Store((s) => s.dirtyRegistry);
    const dirtyKeys = useMemo(
        () => Object.entries(dirtyRegistry).filter(([, v]) => v).map(([k]) => k),
        [dirtyRegistry],
    );
    const confirmDiscard = useBuilderV4Store((s) => s.confirmDiscard);
    const requestSave = useBuilderV4Store((s) => s.requestSave);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            const isSaveCombo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's';
            if (!isSaveCombo) return;
            e.preventDefault();
            if (dirty) requestSave();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [dirty, requestSave]);

    const count = dirtyKeys.length;
    const summary = dirtyKeys.join(' · ');

    return (
        <div
            aria-hidden={!dirty}
            className={cn(
                'absolute right-0 bottom-0 left-0 z-20 flex items-center gap-3 border-t border-border bg-card px-6 py-3 shadow-[0_-12px_28px_-12px_rgba(31,26,18,0.18)]',
                'transition-transform duration-300 ease-out',
                dirty ? 'translate-y-0' : 'translate-y-[120%]',
            )}
        >
            <div className="flex-1 font-mono text-[11px] tracking-wide text-muted-foreground">
                <strong className="font-display text-[13px] font-semibold text-foreground">
                    {count} unsaved change{count === 1 ? '' : 's'}
                </strong>
                {summary && (
                    <>
                        {' · '}
                        <span>{summary}</span>
                    </>
                )}
            </div>
            <button
                type="button"
                onClick={confirmDiscard}
                disabled={!dirty}
                className="rounded-md border border-border bg-transparent px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-[var(--bg-raised)]"
            >
                Discard
            </button>
            <button
                type="button"
                onClick={() => requestSave()}
                disabled={!dirty}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
                Save changes
                <span className="rounded bg-white/20 px-1 py-0.5 font-mono text-[9.5px]">⌘S</span>
            </button>
        </div>
    );
}
