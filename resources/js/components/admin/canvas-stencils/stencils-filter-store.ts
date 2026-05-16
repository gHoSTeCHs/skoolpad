import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Filter / view state for the admin stencil management page.
 *
 * Persisted to localStorage so the author's last category + search stick
 * across page navigations. Separate store from the Excalidraw modal's
 * `useStencilStore` — that one caches the catalog itself; this one carries
 * filter UI state for the admin surface.
 */

interface StencilsFilterState {
    search: string;
    activeCategory: string;
    activeLicense: string;
    setSearch: (search: string) => void;
    setActiveCategory: (category: string) => void;
    setActiveLicense: (license: string) => void;
    reset: () => void;
}

export const useStencilsFilterStore = create<StencilsFilterState>()(
    persist(
        (set) => ({
            search: '',
            activeCategory: 'all',
            activeLicense: 'all',
            setSearch: (search) => set({ search }),
            setActiveCategory: (activeCategory) => set({ activeCategory }),
            setActiveLicense: (activeLicense) => set({ activeLicense }),
            reset: () => set({ search: '', activeCategory: 'all', activeLicense: 'all' }),
        }),
        { name: 'skoolpad.admin.stencils.filters' },
    ),
);

export interface StencilRow {
    id: string;
    name: string;
    slug: string;
    category: string;
    tags: string[];
    svg_url: string;
    svg_path: string;
    license: string;
    license_label: string;
    requires_attribution: boolean;
    attribution: string | null;
    source_url: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export function useFilteredStencilRows(stencils: StencilRow[]): StencilRow[] {
    const search = useStencilsFilterStore((s) => s.search);
    const activeCategory = useStencilsFilterStore((s) => s.activeCategory);
    const activeLicense = useStencilsFilterStore((s) => s.activeLicense);

    return useMemo(() => {
        const q = search.trim().toLowerCase();
        return stencils.filter((s) => {
            if (activeCategory !== 'all' && s.category !== activeCategory) return false;
            if (activeLicense !== 'all' && s.license !== activeLicense) return false;
            if (!q) return true;
            return (
                s.name.toLowerCase().includes(q)
                || s.slug.toLowerCase().includes(q)
                || s.tags.some((t) => t.toLowerCase().includes(q))
            );
        });
    }, [stencils, search, activeCategory, activeLicense]);
}
