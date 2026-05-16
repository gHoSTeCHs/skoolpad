import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Filter / view state for the admin asset browser (Polish A.2).
 *
 * Persisted to localStorage so admins keep their scope/a11y filter across
 * navigations.
 */

export type ScopeFilter = 'all' | 'content_block' | 'question' | 'question_paper';
export type AltFilter = 'all' | 'missing' | 'present';

interface AssetsFilterState {
    search: string;
    scope: ScopeFilter;
    altFilter: AltFilter;
    setSearch: (search: string) => void;
    setScope: (scope: ScopeFilter) => void;
    setAltFilter: (altFilter: AltFilter) => void;
    reset: () => void;
}

export const useAssetsFilterStore = create<AssetsFilterState>()(
    persist(
        (set) => ({
            search: '',
            scope: 'all',
            altFilter: 'all',
            setSearch: (search) => set({ search }),
            setScope: (scope) => set({ scope }),
            setAltFilter: (altFilter) => set({ altFilter }),
            reset: () => set({ search: '', scope: 'all', altFilter: 'all' }),
        }),
        { name: 'skoolpad.admin.assets.filters' },
    ),
);

export interface AssetRow {
    id: string;
    kind: string;
    scope: 'content_block' | 'question' | 'question_paper';
    owner_label: string;
    owner_url: string | null;
    alt_text: string | null;
    caption: string | null;
    has_alt_text: boolean;
    has_svg: boolean;
    svg_url: string;
    created_by_name: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export function useFilteredAssetRows(assets: AssetRow[]): AssetRow[] {
    const search = useAssetsFilterStore((s) => s.search);
    const scope = useAssetsFilterStore((s) => s.scope);
    const altFilter = useAssetsFilterStore((s) => s.altFilter);

    return useMemo(() => {
        const q = search.trim().toLowerCase();
        return assets.filter((a) => {
            if (scope !== 'all' && a.scope !== scope) return false;
            if (altFilter === 'missing' && a.has_alt_text) return false;
            if (altFilter === 'present' && !a.has_alt_text) return false;
            if (!q) return true;
            return (
                (a.alt_text ?? '').toLowerCase().includes(q)
                || (a.caption ?? '').toLowerCase().includes(q)
                || a.owner_label.toLowerCase().includes(q)
            );
        });
    }, [assets, search, scope, altFilter]);
}
