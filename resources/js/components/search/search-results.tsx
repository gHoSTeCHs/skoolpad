import { SearchX } from 'lucide-react';
import type { GroupedResults } from '@/hooks/use-search';
import type { SearchResultItem } from '@/types/search';
import { SearchResultItemComponent } from './search-result-item';

interface SearchResultsProps {
    groupedResults: GroupedResults;
    totalCount: number;
    selectedIndex: number;
    onSelect: (result: SearchResultItem) => void;
    query: string;
    sectionOrder: (keyof GroupedResults)[];
    sectionLabels: Record<keyof GroupedResults, string>;
}

export function SearchResults({
    groupedResults,
    totalCount,
    selectedIndex,
    onSelect,
    query,
    sectionOrder,
    sectionLabels,
}: SearchResultsProps) {
    if (totalCount === 0 && query.trim().length >= 2) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <SearchX className="mb-3 size-10 opacity-50" />
                <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    No results found for &quot;{query}&quot;
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70" style={{ fontFamily: 'var(--font-body)' }}>
                    Try a different search term
                </p>
            </div>
        );
    }

    let flatIndex = 0;

    return (
        <div className="space-y-4">
            {sectionOrder.map((key) => {
                const results = groupedResults[key];
                if (results.length === 0) return null;

                const sectionStartIndex = flatIndex;

                const section = (
                    <div key={key}>
                        <div className="mb-2 flex items-center justify-between px-1">
                            <span
                                className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                                style={{ fontFamily: 'var(--font-body)' }}
                            >
                                {sectionLabels[key]}
                            </span>
                            <span className="text-[11px] text-muted-foreground/70">{results.length}</span>
                        </div>
                        <div className="space-y-1">
                            {results.map((result, idx) => {
                                const itemIndex = sectionStartIndex + idx;
                                return (
                                    <SearchResultItemComponent
                                        key={result.id}
                                        result={result}
                                        isSelected={itemIndex === selectedIndex}
                                        index={itemIndex}
                                        query={query}
                                        onClick={() => onSelect(result)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );

                flatIndex += results.length;
                return section;
            })}
        </div>
    );
}
