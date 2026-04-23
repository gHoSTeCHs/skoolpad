import { useMemo } from 'react';
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AlertTriangle } from 'lucide-react';
import { SchemeTopicCard } from '@/components/admin/content-studio/scheme-topic-card';
import type { SchemeTerm, SchemeTopicAllocation } from '@/types/content-studio';

interface SchemeGridProps {
    terms: SchemeTerm[];
    onChange: (updatedTerms: SchemeTerm[]) => void;
}

function generateTopicId(termNumber: number, index: number): string {
    return `term-${termNumber}-topic-${index}`;
}

function getWeekLoad(topics: SchemeTopicAllocation[], week: number): number {
    return topics
        .filter((t) => t.week_start <= week && t.week_end >= week)
        .reduce((sum, t) => {
            const span = t.week_end - t.week_start + 1;
            return sum + Math.ceil(t.periods / span);
        }, 0);
}

function TermColumn({
    term,
    onReorder,
    onTopicUpdate,
}: {
    term: SchemeTerm;
    onReorder: (oldIndex: number, newIndex: number) => void;
    onTopicUpdate: (index: number, field: 'periods' | 'notes', value: number | string | null) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const sortableIds = useMemo(
        () => term.topics.map((_, i) => generateTopicId(term.term_number, i)),
        [term.topics, term.term_number],
    );

    const totalPeriods = term.topics.reduce((sum, t) => sum + t.periods, 0);

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = sortableIds.indexOf(active.id as string);
        const newIndex = sortableIds.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;

        onReorder(oldIndex, newIndex);
    }

    const maxWeek = term.instructional_weeks;
    const overloadedWeeks = useMemo(() => {
        const weeks: number[] = [];
        for (let w = 1; w <= maxWeek; w++) {
            if (getWeekLoad(term.topics, w) > 5) {
                weeks.push(w);
            }
        }
        return weeks;
    }, [term.topics, maxWeek]);

    return (
        <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-2 flex items-baseline justify-between px-1">
                <h4 className="font-display text-sm font-semibold">Term {term.term_number}</h4>
                <span className="text-xs text-muted-foreground">
                    {term.instructional_weeks}w · {totalPeriods}p
                </span>
            </div>

            {overloadedWeeks.length > 0 && (
                <div className="mb-2 flex items-center gap-1.5 rounded-md bg-[var(--warning)]/10 px-2 py-1 text-[10px] text-[var(--warning)] dark:bg-yellow-900/20 dark:text-yellow-400 reader:bg-yellow-900/20 reader:text-yellow-400">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>Heavy load: Week {overloadedWeeks.join(', ')}</span>
                </div>
            )}

            <div className="rounded-lg border bg-muted/20 p-2 dark:bg-muted/5 reader:bg-muted/5">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sortableIds}
                        strategy={verticalListSortingStrategy}
                    >
                        {term.topics.length === 0 ? (
                            <div className="flex items-center justify-center rounded-md border border-dashed py-6 text-xs text-muted-foreground/60">
                                No topics in this term
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {term.topics.map((topic, index) => (
                                    <SchemeTopicCard
                                        key={sortableIds[index]}
                                        id={sortableIds[index]}
                                        topic={topic}
                                        onPeriodsChange={(p) => onTopicUpdate(index, 'periods', p)}
                                        onNotesChange={(n) => onTopicUpdate(index, 'notes', n)}
                                    />
                                ))}
                            </div>
                        )}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}

export function SchemeGrid({ terms, onChange }: SchemeGridProps) {
    function handleReorder(termIndex: number, oldTopicIndex: number, newTopicIndex: number) {
        const updated = terms.map((term, i) => {
            if (i !== termIndex) return term;

            const reordered = arrayMove(term.topics, oldTopicIndex, newTopicIndex);

            let currentWeek = 1;
            const recalculated = reordered.map((topic) => {
                const span = topic.week_end - topic.week_start + 1;
                const newStart = currentWeek;
                const newEnd = currentWeek + span - 1;
                currentWeek = newEnd + 1;
                return { ...topic, week_start: newStart, week_end: newEnd };
            });

            return {
                ...term,
                topics: recalculated,
                total_periods: recalculated.reduce((sum, t) => sum + t.periods, 0),
            };
        });

        onChange(updated);
    }

    function handleTopicUpdate(
        termIndex: number,
        topicIndex: number,
        field: 'periods' | 'notes',
        value: number | string | null,
    ) {
        const updated = terms.map((term, ti) => {
            if (ti !== termIndex) return term;

            const topics = term.topics.map((topic, topI) => {
                if (topI !== topicIndex) return topic;
                return { ...topic, [field]: value };
            });

            return {
                ...term,
                topics,
                total_periods: topics.reduce((sum, t) => sum + t.periods, 0),
            };
        });

        onChange(updated);
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {terms.map((term, termIndex) => (
                <TermColumn
                    key={term.term_number}
                    term={term}
                    onReorder={(old, New) => handleReorder(termIndex, old, New)}
                    onTopicUpdate={(topicIdx, field, value) => handleTopicUpdate(termIndex, topicIdx, field, value)}
                />
            ))}
        </div>
    );
}
