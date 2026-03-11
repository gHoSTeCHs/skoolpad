import { useCallback, useEffect, useState } from 'react';
import type { SearchHistoryItem } from '@/types/search';

const STORAGE_KEY = 'skoolpad-search-history';
const MAX_HISTORY_ITEMS = 10;

interface UseSearchHistoryReturn {
    history: SearchHistoryItem[];
    addToHistory: (query: string, resultCount: number) => void;
    clearHistory: () => void;
}

export function useSearchHistory(): UseSearchHistoryReturn {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch {
            setHistory([]);
        }
    }, []);

    const addToHistory = useCallback((query: string, resultCount: number) => {
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) return;

        setHistory((prev) => {
            const filtered = prev.filter(
                (item) => item.query.toLowerCase() !== trimmed.toLowerCase(),
            );

            const newItem: SearchHistoryItem = {
                query: trimmed,
                resultCount,
                timestamp: Date.now(),
            };

            const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
                /* localStorage unavailable */
            }

            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            /* localStorage unavailable */
        }
    }, []);

    return { history, addToHistory, clearHistory };
}
