import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchResponse, SearchResultItem } from '@/types/search';

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

interface GroupedResults {
    topics: SearchResultItem[];
    courses: SearchResultItem[];
    questions: SearchResultItem[];
    notes: SearchResultItem[];
}

const SECTION_ORDER: (keyof GroupedResults)[] = ['topics', 'courses', 'questions', 'notes'];

const SECTION_LABELS: Record<keyof GroupedResults, string> = {
    topics: 'Topics',
    courses: 'Courses',
    questions: 'Questions',
    notes: 'Notes',
};

interface UseSearchReturn {
    query: string;
    setQuery: (query: string) => void;
    groupedResults: GroupedResults;
    totalCount: number;
    allResults: SearchResultItem[];
    isLoading: boolean;
    error: string | null;
    sectionOrder: (keyof GroupedResults)[];
    sectionLabels: Record<keyof GroupedResults, string>;
}

const emptyGroups: GroupedResults = {
    topics: [],
    courses: [],
    questions: [],
    notes: [],
};

export function useSearch(): UseSearchReturn {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const abortRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);

        if (!query.trim() || query.trim().length < 2) {
            setResults(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        debounceRef.current = setTimeout(async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getCsrfToken(),
                    },
                });
                if (!response.ok) throw new Error('Search failed');
                const data: SearchResponse = await response.json();
                if (mountedRef.current) {
                    setResults(data);
                    setError(null);
                }
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                if (mountedRef.current) {
                    setResults(null);
                    setError('Search failed. Please try again.');
                }
            } finally {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            }
        }, 250);

        return () => {
            clearTimeout(debounceRef.current);
            abortRef.current?.abort();
        };
    }, [query]);

    const groupedResults = useMemo<GroupedResults>(() => {
        if (!results) return emptyGroups;
        return {
            topics: results.topics,
            courses: results.courses,
            questions: results.questions,
            notes: results.notes,
        };
    }, [results]);

    const allResults = useMemo(() => {
        const flat: SearchResultItem[] = [];
        for (const key of SECTION_ORDER) {
            flat.push(...groupedResults[key]);
        }
        return flat;
    }, [groupedResults]);

    const totalCount = allResults.length;

    return {
        query,
        setQuery,
        groupedResults,
        totalCount,
        allResults,
        isLoading,
        error,
        sectionOrder: SECTION_ORDER,
        sectionLabels: SECTION_LABELS,
    };
}

export type { GroupedResults };
