import { BookOpen, FileQuestion, GraduationCap, StickyNote } from 'lucide-react';
import type { SearchEntityType, SearchResultItem } from '@/types/search';

interface SearchResultItemProps {
    result: SearchResultItem;
    isSelected: boolean;
    index: number;
    query: string;
    onClick: () => void;
}

const entityConfig: Record<
    SearchEntityType,
    { icon: typeof BookOpen; colorClass: string; bgClass: string; label: string }
> = {
    topic: { icon: BookOpen, colorClass: 'text-emerald-600 dark:text-emerald-400 reader:text-emerald-400', bgClass: 'bg-emerald-600/10 dark:bg-emerald-400/10 reader:bg-emerald-400/10', label: 'Topic' },
    course: { icon: GraduationCap, colorClass: 'text-blue-600 dark:text-blue-400 reader:text-blue-400', bgClass: 'bg-blue-600/10 dark:bg-blue-400/10 reader:bg-blue-400/10', label: 'Course' },
    question: { icon: FileQuestion, colorClass: 'text-amber-600 dark:text-amber-400 reader:text-amber-400', bgClass: 'bg-amber-600/10 dark:bg-amber-400/10 reader:bg-amber-400/10', label: 'Question' },
    note: { icon: StickyNote, colorClass: 'text-purple-600 dark:text-purple-400 reader:text-purple-400', bgClass: 'bg-purple-600/10 dark:bg-purple-400/10 reader:bg-purple-400/10', label: 'Note' },
};

function highlightText(text: string, query: string) {
    if (!query || query.length < 2) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
                {part}
            </mark>
        ) : (
            part
        ),
    );
}

export function SearchResultItemComponent({ result, isSelected, index, query, onClick }: SearchResultItemProps) {
    const config = entityConfig[result.type];
    const Icon = config.icon;

    return (
        <button
            type="button"
            data-index={index}
            onClick={onClick}
            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-transparent hover:bg-accent'
            }`}
        >
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${config.bgClass}`}>
                <Icon className={`size-[18px] ${config.colorClass}`} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                        {highlightText(result.title, query)}
                    </span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${config.bgClass} ${config.colorClass}`}>
                        {config.label}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {highlightText(result.subtitle, query)}
                </p>
                {result.description && (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                        {result.description}
                    </p>
                )}
            </div>
        </button>
    );
}
