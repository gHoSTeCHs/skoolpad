import { useState } from 'react';

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MatchingConfig } from '@/types/questions';

interface MatchingInputProps {
    responseConfig: MatchingConfig;
    onSubmit: (data: { pairs: Record<string, number> }) => void;
    feedback?: { isCorrect: boolean | null; correctAnswer: { pairs?: { left: string; right: string }[] } | null } | null;
    readOnly?: boolean;
    existingAnswer?: { pairs: Record<string, number> } | null;
}

interface SortableRightItemProps {
    id: string;
    text: string;
    feedbackStyle: string;
    isDisabled: boolean;
}

function SortableRightItem({ id, text, feedbackStyle, isDisabled }: SortableRightItemProps) {
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
                'flex items-center gap-2 rounded-lg border p-3 bg-card transition-colors h-full',
                isDragging && 'opacity-50 shadow-lg',
                feedbackStyle,
            )}
        >
            <button
                {...listeners}
                type="button"
                className={cn(
                    'text-muted-foreground transition-colors shrink-0',
                    !isDisabled && 'cursor-grab hover:text-foreground active:cursor-grabbing',
                    isDisabled && 'cursor-default opacity-40',
                )}
                disabled={isDisabled}
                tabIndex={-1}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <span className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                {text}
            </span>
        </div>
    );
}

export function MatchingInput({ responseConfig, onSubmit, feedback, readOnly, existingAnswer }: MatchingInputProps) {
    const pairs = responseConfig?.pairs ?? [];
    const isSubmitted = !!feedback || !!readOnly;

    const [rightIds, setRightIds] = useState<string[]>(() => {
        if (existingAnswer?.pairs) {
            return pairs.map((_, i) => String(existingAnswer.pairs[String(i)] ?? i));
        }
        const shuffled = pairs.map((_, i) => String(i));
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
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
            setRightIds((prev) => {
                const oldIndex = prev.indexOf(active.id as string);
                const newIndex = prev.indexOf(over.id as string);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    }

    function handleSubmit() {
        if (isSubmitted) return;
        const pairsData: Record<string, number> = {};
        rightIds.forEach((rightId, leftPosition) => {
            pairsData[String(leftPosition)] = Number(rightId);
        });
        onSubmit({ pairs: pairsData });
    }

    function getRightItemFeedbackStyle(leftPosition: number): string {
        if (!isSubmitted) {
            return 'border-border hover:border-primary/40';
        }
        if (!feedback) {
            return 'border-border opacity-70';
        }
        const originalRightIndex = Number(rightIds[leftPosition]);
        const isCorrect = originalRightIndex === leftPosition;
        return isCorrect
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-destructive bg-destructive/10';
    }

    return (
        <div className="space-y-3">
            {!isSubmitted && (
                <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Reorder the right column to match each item on the left
                </p>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={rightIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {pairs.map((pair, leftIndex) => (
                            <div key={leftIndex} className="grid grid-cols-2 gap-2 items-stretch">
                                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {leftIndex + 1}
                                    </span>
                                    <span className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-content)' }}>
                                        {pair.left}
                                    </span>
                                </div>
                                <SortableRightItem
                                    id={rightIds[leftIndex]}
                                    text={pairs[Number(rightIds[leftIndex])]?.right ?? ''}
                                    feedbackStyle={getRightItemFeedbackStyle(leftIndex)}
                                    isDisabled={isSubmitted}
                                />
                            </div>
                        ))}
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
