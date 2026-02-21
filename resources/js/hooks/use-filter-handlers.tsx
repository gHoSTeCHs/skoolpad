import { router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

/**
 * Base filter interface with common query parameters.
 * Extend this interface for page-specific filters.
 */
export interface BaseFilters {
    search?: string;
    sort?: string;
    direction?: string;
    [key: string]: string | undefined;
}

export interface UseFilterHandlersOptions<T extends BaseFilters> {
    indexUrl: string;
    filters: T;
    preserveSearch?: boolean;
}

export interface UseFilterHandlersReturn {
    readonly handleFilterChange: (key: string, value: string | undefined) => void;
    readonly clearFilters: () => void;
    readonly hasActiveFilters: boolean;
}

/**
 * Hook for managing filter state in index pages with URL-based filtering.
 *
 * Provides standardized filter handlers that sync with URL query parameters
 * while preserving pagination state and scroll position.
 *
 * @param options - Configuration options
 * @param options.indexUrl - The index route URL to navigate to
 * @param options.filters - Current filter state from Inertia props
 * @param options.preserveSearch - Whether to preserve search filter when clearing (default: true)
 * @returns Object containing filter handler functions and active filter state
 *
 * @example
 * const { handleFilterChange, clearFilters, hasActiveFilters } = useFilterHandlers({
 *     indexUrl: InstitutionController.index.url(),
 *     filters,
 * });
 *
 * <Select onValueChange={(value) => handleFilterChange('institution_type', value)} />
 * {hasActiveFilters && <Button onClick={clearFilters}>Clear filters</Button>}
 */
export function useFilterHandlers<T extends BaseFilters>({
    indexUrl,
    filters,
    preserveSearch = true,
}: UseFilterHandlersOptions<T>): UseFilterHandlersReturn {
    const hasActiveFilters = useMemo(() => {
        const { search, sort, direction, ...filterableKeys } = filters;
        return Object.values(filterableKeys).some((value) => value !== undefined && value !== '');
    }, [filters]);

    const handleFilterChange = useCallback(
        (key: string, value: string | undefined) => {
            const params = {
                ...filters,
                [key]: value || undefined,
            };

            if (preserveSearch) {
                params.search = filters.search || undefined;
            }

            router.get(indexUrl, params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [indexUrl, filters, preserveSearch],
    );

    const clearFilters = useCallback(() => {
        const params: BaseFilters = {
            sort: filters.sort,
            direction: filters.direction,
        };

        if (preserveSearch) {
            params.search = filters.search || undefined;
        }

        router.get(indexUrl, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [indexUrl, filters, preserveSearch]);

    return { handleFilterChange, clearFilters, hasActiveFilters } as const;
}
