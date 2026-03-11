import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
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
        query, setQuery, groupedResults, totalCount, allResults, isLoading, error,
        sectionOrder, sectionLabels,
    } = useSearch();
    const { history, addToHistory, clearHistory } = useSearchHistory();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const resultsRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const stateRef = useRef({ totalCount, allResults, selectedIndex, isOpen });
    stateRef.current = { totalCount, allResults, selectedIndex, isOpen };

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen, setQuery]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        setSelectedIndex((prev) => Math.min(prev, Math.max(totalCount - 1, 0)));
    }, [totalCount]);

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

    const getFocusableElements = useCallback((): HTMLElement[] => {
        if (!modalRef.current) return [];
        return Array.from(
            modalRef.current.querySelectorAll<HTMLElement>(
                'input, button, [tabindex]:not([tabindex="-1"])',
            ),
        );
    }, []);

    const handleSelectRef = useRef(handleSelect);
    handleSelectRef.current = handleSelect;

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const { isOpen: open, totalCount: count, allResults: results, selectedIndex: idx } = stateRef.current;
            if (!open) return;

            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if (e.key === 'Tab') {
                const focusable = getFocusableElements();
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, count - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && count > 0) {
                e.preventDefault();
                const result = results[idx];
                if (result) handleSelectRef.current(result);
            }
        },
        [onClose, getFocusableElements],
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
                aria-hidden="true"
            />
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label="Search"
                className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 px-4"
            >
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                    <div className="border-b border-border p-4">
                        <SearchInput value={query} onChange={setQuery} isLoading={isLoading} />
                    </div>
                    <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-4">
                        {error ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <AlertCircle className="mb-3 size-10 text-destructive/60" />
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : query.trim().length < 2 ? (
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
                                isLoading={isLoading}
                            />
                        )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                            {totalCount > 0 && (
                                <>
                                    <span className="flex items-center gap-1">
                                        <kbd className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">↑↓</kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">↵</kbd>
                                        Select
                                    </span>
                                </>
                            )}
                            <span className="flex items-center gap-1">
                                <kbd className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
                                Close
                            </span>
                        </div>
                        {totalCount > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                                {totalCount} result{totalCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
