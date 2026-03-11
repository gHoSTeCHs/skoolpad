import { Clock, Trash2 } from 'lucide-react';
import type { SearchHistoryItem } from '@/types/search';

interface RecentSearchesProps {
    history: SearchHistoryItem[];
    onSelect: (query: string) => void;
    onClear: () => void;
}

export function RecentSearches({ history, onSelect, onClear }: RecentSearchesProps) {
    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="mb-3 size-10 opacity-50" />
                <p className="text-sm">
                    No recent searches
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    Start typing to search across topics, courses, and questions
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Recent Searches
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                >
                    <Trash2 className="size-3" />
                    Clear
                </button>
            </div>
            <div className="space-y-1">
                {history.map((item) => (
                    <button
                        key={item.timestamp}
                        onClick={() => onSelect(item.query)}
                        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent"
                    >
                        <Clock className="size-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="flex-1 truncate text-sm text-foreground">
                            {item.query}
                        </span>
                        <span className="text-[11px] text-muted-foreground/70">
                            {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
