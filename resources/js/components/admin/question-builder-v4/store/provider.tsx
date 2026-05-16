import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { QuestionPaper } from '@/types/questions';
import {
    createQuestionBuilderV4Store,
    type QuestionBuilderV4State,
    type QuestionBuilderV4Store,
} from './create-store';

const StoreContext = createContext<QuestionBuilderV4Store | null>(null);

interface ProviderProps {
    paper: QuestionPaper;
    children: ReactNode;
}

export function QuestionBuilderV4Provider({ paper, children }: ProviderProps) {
    const storeRef = useRef<QuestionBuilderV4Store | null>(null);
    if (storeRef.current === null) {
        storeRef.current = createQuestionBuilderV4Store(paper);
    }
    return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

export function useBuilderV4Store<T>(selector: (state: QuestionBuilderV4State) => T): T {
    const store = useContext(StoreContext);
    if (store === null) {
        throw new Error('useBuilderV4Store must be used within a QuestionBuilderV4Provider');
    }
    return useStore(store, selector);
}
