import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearch } from '@/hooks/use-search';
import { useSearchHistory } from '@/hooks/use-search-history';
import type { SearchResultItem } from '@/types/search';
import { RecentSearches } from './recent-searches';
import { SearchInput } from './search-input';
import { SearchResults } from './search-results';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const {
        query, setQuery, groupedResults, totalCount, allResults, isLoading,
        sectionOrder, sectionLabels,
    } = useSearch();
    const { history, addToHistory, clearHistory } = useSearchHistory();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen, setQuery]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleSelect = useCallback(
        (result: SearchResultItem) => {
            if (query.trim().length >= 2) {
                addToHistory(query, totalCount);
            }
            router.visit(result.url);
            onClose();
        },
        [onClose, query, totalCount, addToHistory],
    );

    const handleHistorySelect = useCallback(
        (historyQuery: string) => {
            setQuery(historyQuery);
        },
        [setQuery],
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, totalCount - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && totalCount > 0) {
                e.preventDefault();
                const result = allResults[selectedIndex];
                if (result) handleSelect(result);
            }
        },
        [isOpen, onClose, totalCount, allResults, selectedIndex, handleSelect],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (resultsRef.current && selectedIndex >= 0) {
            const el = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 px-4">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                    <div className="border-b border-border p-4">
                        <SearchInput value={query} onChange={setQuery} isLoading={isLoading} />
                    </div>
                    <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-4">
                        {query.trim().length < 2 ? (
                            <RecentSearches
                                history={history}
                                onSelect={handleHistorySelect}
                                onClear={clearHistory}
                            />
                        ) : (
                            <SearchResults
                                groupedResults={groupedResults}
                                totalCount={totalCount}
                                selectedIndex={selectedIndex}
                                onSelect={handleSelect}
                                query={query}
                                sectionOrder={sectionOrder}
                                sectionLabels={sectionLabels}
                            />
                        )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">↵</kbd>
                                Select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
                                Close
                            </span>
                        </div>
                        {totalCount > 0 && (
                            <span
                                className="text-[11px] text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                {totalCount} result{totalCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
