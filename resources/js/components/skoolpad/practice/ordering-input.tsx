import { useState } from 'react';

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { OrderingConfig } from '@/types/questions';

interface OrderingInputProps {
    responseConfig: OrderingConfig;
    onSubmit: (data: { order: number[] }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { correct_order?: number[]; items?: string[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { order: number[] } | null;
}

interface SortableItemProps {
    id: string;
    text: string;
    position: number;
    feedbackStyle: string;
    isDisabled: boolean;
}

function SortableItem({ id, text, position, feedbackStyle, isDisabled }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: isDisabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                'flex items-center gap-3 rounded-lg border p-3 bg-card transition-colors',
                isDragging && 'opacity-50 shadow-lg',
                feedbackStyle,
            )}
        >
            <button
                {...listeners}
                type="button"
                className={cn(
                    'text-muted-foreground transition-colors',
                    !isDisabled && 'cursor-grab hover:text-foreground active:cursor-grabbing',
                    isDisabled && 'cursor-default opacity-40',
                )}
                disabled={isDisabled}
                tabIndex={-1}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <span className="flex-1 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                {text}
            </span>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {position}
            </span>
        </div>
    );
}

export function OrderingInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: OrderingInputProps) {
    const items = responseConfig?.items ?? [];
    const isSubmitted = !!feedback || !!readOnly;

    const [orderedIds, setOrderedIds] = useState<string[]>(() => {
        if (existingAnswer?.order) {
            return existingAnswer.order.map(String);
        }
        const ids = items.map((_, i) => String(i));
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        return ids;
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setOrderedIds((prev) => {
                const oldIndex = prev.indexOf(active.id as string);
                const newIndex = prev.indexOf(over.id as string);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    }

    function handleSubmit() {
        if (isSubmitted) return;
        onSubmit({ order: orderedIds.map(Number) });
    }

    function getItemFeedbackStyle(originalIndex: number, position: number): string {
        if (!isSubmitted) {
            return 'border-border hover:border-primary/40';
        }
        if (!feedback?.correctAnswer?.correct_order) {
            return 'border-border opacity-70';
        }
        const isCorrect = feedback.correctAnswer.correct_order[position] === originalIndex;
        return isCorrect
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-destructive bg-destructive/10';
    }

    return (
        <div className="space-y-3">
            {!isSubmitted && (
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Drag the items into the correct order
                </p>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {orderedIds.map((id, position) => {
                            const originalIndex = Number(id);
                            return (
                                <SortableItem
                                    key={id}
                                    id={id}
                                    text={items[originalIndex] ?? ''}
                                    position={position + 1}
                                    feedbackStyle={getItemFeedbackStyle(originalIndex, position)}
                                    isDisabled={isSubmitted}
                                />
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>

            {!isSubmitted && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                >
                    Submit Answer
                </button>
            )}
        </div>
    );
}
