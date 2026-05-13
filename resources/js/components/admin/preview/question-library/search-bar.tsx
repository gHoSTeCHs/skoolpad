import { useEffect } from 'react';
import { Search } from 'lucide-react';
import type { LibraryStatusFilter } from '@/types/question-library';

interface SearchBarProps {
    statusFilter: LibraryStatusFilter;
    onStatusFilterChange: (filter: LibraryStatusFilter) => void;
    onOpenCommandPalette: () => void;
}

const FILTERS: { value: LibraryStatusFilter; label: string }[] = [
    { value: 'all', label: 'All status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
];

export function SearchBar({ statusFilter, onStatusFilterChange, onOpenCommandPalette }: SearchBarProps) {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                onOpenCommandPalette();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenCommandPalette]);

    return (
        <div
            className="grid grid-cols-[1fr_auto] items-center gap-[18px] px-[30px] py-4"
            style={{ borderBottom: '1px solid var(--border-2)' }}
        >
            <button
                type="button"
                onClick={onOpenCommandPalette}
                className="flex items-center gap-3 rounded-[10px] border border-border bg-background px-3.5 py-2.5 text-[13px] text-[var(--fg-subtle)] transition-colors hover:border-[var(--fg-subtle)] hover:text-muted-foreground"
            >
                <Search className="size-[14px]" />
                <span className="flex-1 text-left">
                    Search across all containers — paper title, question stem, topic, course code…
                </span>
                <kbd
                    className="rounded border border-border bg-[var(--bg-raised)] px-1.5 py-[1px] text-[10.5px] text-[var(--fg-subtle)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                >
                    ⌘ K
                </kbd>
            </button>

            <div className="flex items-center gap-2">
                {FILTERS.map((filter) => {
                    const isActive = statusFilter === filter.value;
                    return (
                        <button
                            key={filter.value}
                            type="button"
                            onClick={() => onStatusFilterChange(filter.value)}
                            className={
                                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors '
                                + (isActive
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border bg-background text-muted-foreground hover:border-[var(--fg-subtle)] hover:text-foreground')
                            }
                            style={{ fontFamily: 'var(--font-body)' }}
                        >
                            {filter.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
