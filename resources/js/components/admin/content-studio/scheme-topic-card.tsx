import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { SchemeTopicAllocation } from '@/types/content-studio';

interface SchemeTopicCardProps {
    id: string;
    topic: SchemeTopicAllocation;
    onPeriodsChange: (periods: number) => void;
    onNotesChange: (notes: string | null) => void;
}

export function SchemeTopicCard({ id, topic, onPeriodsChange, onNotesChange }: SchemeTopicCardProps) {
    const [isEditingPeriods, setIsEditingPeriods] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const weekLabel = topic.week_start === topic.week_end
        ? `W${topic.week_start}`
        : `W${topic.week_start}–${topic.week_end}`;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-start gap-1.5 rounded-md border bg-card px-2 py-1.5 text-sm transition-shadow ${
                isDragging
                    ? 'z-50 opacity-90 shadow-lg ring-1 ring-primary/20'
                    : 'hover:shadow-sm'
            }`}
        >
            <button
                type="button"
                className="mt-0.5 shrink-0 touch-none cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-3.5" />
            </button>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] leading-none text-muted-foreground/60">
                        {weekLabel}
                    </span>
                    <span className="truncate text-xs font-medium text-foreground">
                        {topic.title}
                    </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5">
                    {isEditingPeriods ? (
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            value={topic.periods}
                            onChange={(e) => onPeriodsChange(Math.max(1, parseInt(e.target.value) || 1))}
                            onBlur={() => setIsEditingPeriods(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingPeriods(false)}
                            className="h-5 w-12 px-1 text-center font-mono text-[10px]"
                            autoFocus
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsEditingPeriods(true)}
                            className="cursor-text"
                        >
                            <Badge variant="outline" className="px-1 py-0 font-mono text-[10px] leading-tight">
                                {topic.periods}p
                            </Badge>
                        </button>
                    )}

                    {isEditingNotes ? (
                        <Input
                            type="text"
                            value={topic.notes ?? ''}
                            onChange={(e) => onNotesChange(e.target.value || null)}
                            onBlur={() => setIsEditingNotes(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingNotes(false)}
                            placeholder="Add note..."
                            className="h-5 flex-1 px-1 text-[10px] text-muted-foreground"
                            autoFocus
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsEditingNotes(true)}
                            className="min-w-0 cursor-text truncate text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
                        >
                            {topic.notes ?? (
                                <span className="invisible group-hover:visible">+ note</span>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
