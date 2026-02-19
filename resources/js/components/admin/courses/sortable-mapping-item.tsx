import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { MappedTopic, TopicWeight, WeightOption } from '@/types/mappings';

const difficultyLabels: Record<string, string> = {
    foundational: 'Foundational',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
};

const difficultyStyles: Record<string, string> = {
    foundational:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 reader:bg-blue-900/30 reader:text-blue-400',
    intermediate: 'bg-[var(--badge-reward-bg)] text-[var(--badge-reward-fg)]',
    advanced: 'bg-[var(--badge-danger-bg)] text-[var(--badge-danger-fg)]',
};

interface SortableMappingItemProps {
    mapping: MappedTopic;
    weightOptions: WeightOption[];
    onWeightChange: (canonicalTopicId: string, weight: TopicWeight) => void;
    onRemove: (canonicalTopicId: string) => void;
}

export function SortableMappingItem({
    mapping,
    weightOptions,
    onWeightChange,
    onRemove,
}: SortableMappingItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: mapping.canonical_topic_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 ${isDragging ? 'z-50 opacity-90 shadow-lg' : ''}`}
        >
            <button
                type="button"
                className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>

            <span className="w-7 shrink-0 text-center text-xs font-medium text-muted-foreground">
                {String(mapping.sequence_order).padStart(2, '0')}
            </span>

            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {mapping.title}
            </span>

            <Badge
                variant="outline"
                className={`shrink-0 border-transparent ${difficultyStyles[mapping.difficulty_level] ?? ''}`}
            >
                {difficultyLabels[mapping.difficulty_level] ??
                    mapping.difficulty_level}
            </Badge>

            <Select
                value={mapping.weight}
                onValueChange={(value) =>
                    onWeightChange(
                        mapping.canonical_topic_id,
                        value as TopicWeight,
                    )
                }
            >
                <SelectTrigger className="h-8 w-[130px] shrink-0 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {weightOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(mapping.canonical_topic_id)}
            >
                <X className="size-3.5" />
            </Button>
        </div>
    );
}
