import { createContext, useContext, type ReactNode } from 'react';
import { useSearchModal } from '@/hooks/use-search-modal';

interface SearchContextValue {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
    const { isOpen, open, close } = useSearchModal();

    return (
        <SearchContext.Provider value={{ isOpen, open, close }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearchContext(): SearchContextValue {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearchContext must be used within a SearchProvider');
    }
    return context;
}
