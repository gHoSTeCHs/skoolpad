import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useStore } from 'zustand';
import {
    createQuestionBuilderStore,
    type QuestionBuilderState,
    type QuestionBuilderStore,
} from './create-store';
import type { SelectedNode } from '../paper-tree';

const StoreContext = createContext<QuestionBuilderStore | null>(null);

interface ProviderProps {
    initialSelectedNode: SelectedNode | null;
    /** Test-only escape hatch: inject a pre-created store instead of creating one. */
    store?: QuestionBuilderStore;
    children: ReactNode;
}

export function QuestionBuilderProvider({ initialSelectedNode, store, children }: ProviderProps) {
    const storeRef = useRef<QuestionBuilderStore | null>(null);
    if (storeRef.current === null) {
        storeRef.current = store ?? createQuestionBuilderStore(initialSelectedNode);
    }
    return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

export function useBuilderStore<T>(selector: (state: QuestionBuilderState) => T): T {
    const store = useContext(StoreContext);
    if (store === null) {
        throw new Error('useBuilderStore must be used within a QuestionBuilderProvider');
    }
    return useStore(store, selector);
}
