import { useMemo } from 'react';
import { create } from 'zustand';

/**
 * Shared catalog store for the canvas stencil library (CP11.5).
 *
 * One fetch per page load — cached across modal opens, modal mounts, and
 * surfaces (content blocks / question stems / answer keys / paper contexts
 * / DiagramLabel). The modal subscribes; instance-scoped state (Excalidraw
 * API ref, save flow, errors) stays local to the modal component.
 */

export interface StencilCatalogEntry {
    id: string;
    name: string;
    slug: string;
    category: string;
    tags: string[];
    svg_url: string;
    requires_attribution: boolean;
    attribution: string | null;
}

export interface StencilCategoryEntry {
    value: string;
    label: string;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface StencilStoreState {
    status: Status;
    categories: StencilCategoryEntry[];
    stencils: StencilCatalogEntry[];
    activeCategory: string;
    searchQuery: string;

    load: () => Promise<void>;
    setActiveCategory: (category: string) => void;
    setSearchQuery: (query: string) => void;
    reset: () => void;
}

export const useStencilStore = create<StencilStoreState>((set, get) => ({
    status: 'idle',
    categories: [],
    stencils: [],
    activeCategory: 'all',
    searchQuery: '',

    load: async () => {
        const { status } = get();
        if (status === 'loading' || status === 'ready') return;
        set({ status: 'loading' });
        try {
            const res = await fetch('/admin/canvas-stencils/catalog', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(`Catalog fetch failed (${res.status})`);
            const body: { categories: StencilCategoryEntry[]; stencils: StencilCatalogEntry[] } =
                await res.json();
            set({
                categories: body.categories ?? [],
                stencils: body.stencils ?? [],
                status: 'ready',
            });
        } catch {
            set({ status: 'error', categories: [], stencils: [] });
        }
    },

    setActiveCategory: (category) => set({ activeCategory: category }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    reset: () =>
        set({
            status: 'idle',
            categories: [],
            stencils: [],
            activeCategory: 'all',
            searchQuery: '',
        }),
}));

/**
 * Selector hook: stencils filtered by current category + search.
 * Memoised on the filter inputs so render passes don't recompute every paint.
 */
export function useFilteredStencils(): StencilCatalogEntry[] {
    const stencils = useStencilStore((s) => s.stencils);
    const activeCategory = useStencilStore((s) => s.activeCategory);
    const searchQuery = useStencilStore((s) => s.searchQuery);

    return useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return stencils.filter((s) => {
            if (activeCategory !== 'all' && s.category !== activeCategory) return false;
            if (!q) return true;
            return (
                s.name.toLowerCase().includes(q)
                || s.tags.some((t) => t.toLowerCase().includes(q))
            );
        });
    }, [stencils, activeCategory, searchQuery]);
}

/**
 * Selector hook: the subset of categories that actually have at least one
 * stencil — keeps the filter chip row tight for small libraries (e.g. our
 * 30-symbol seed covers 6 of 13 categories).
 */
export function useActiveCategoryChips(): StencilCategoryEntry[] {
    const categories = useStencilStore((s) => s.categories);
    const stencils = useStencilStore((s) => s.stencils);

    return useMemo(() => {
        const used = new Set(stencils.map((s) => s.category));
        return categories.filter((c) => used.has(c.value));
    }, [categories, stencils]);
}
