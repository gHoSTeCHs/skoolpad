import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { McqConfig } from '@/types/questions';
import type { QuestionFormBridge } from './question-form';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

type Mode = 'mcq' | 'multi_select_mcq';

interface McqBodyProps {
    form: QuestionFormBridge;
    mode: Mode;
}

function emptyConfig(): McqConfig {
    return {
        options: [
            { label: 'A', text: '', is_correct: false },
            { label: 'B', text: '', is_correct: false },
        ],
    };
}

function relabel(options: McqConfig['options']): McqConfig['options'] {
    return options.map((o, i) => ({ ...o, label: OPTION_LABELS[i] }));
}

export function McqBody({ form, mode }: McqBodyProps) {
    const raw = form.data.response_config as McqConfig | null;
    const config: McqConfig = raw && Array.isArray(raw.options) ? raw : emptyConfig();
    const options = config.options;

    const correctCount = options.filter((o) => o.is_correct).length;
    const correctError =
        mode === 'mcq'
            ? correctCount === 0
                ? 'Pick one correct option.'
                : correctCount > 1
                  ? 'MCQ allows only one correct option.'
                  : null
            : correctCount < 2
              ? 'Multi-select requires at least 2 correct options.'
              : null;
    const responseError = form.errors.response_config;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function commit(next: McqConfig) {
        form.setField('response_config', next);
    }

    function toggleCorrect(idx: number) {
        if (mode === 'mcq') {
            commit({
                ...config,
                options: options.map((o, i) => ({ ...o, is_correct: i === idx })),
            });
        } else {
            commit({
                ...config,
                options: options.map((o, i) => (i === idx ? { ...o, is_correct: !o.is_correct } : o)),
            });
        }
    }

    function updateText(idx: number, text: string) {
        commit({
            ...config,
            options: options.map((o, i) => (i === idx ? { ...o, text } : o)),
        });
    }

    function addOption() {
        if (options.length >= MAX_OPTIONS) return;
        const next = [
            ...options,
            { label: OPTION_LABELS[options.length], text: '', is_correct: false },
        ];
        commit({ ...config, options: next });
    }

    function removeOption(idx: number) {
        if (options.length <= MIN_OPTIONS) return;
        const next = relabel(options.filter((_, i) => i !== idx));
        commit({ ...config, options: next });
    }

    function onDragEnd(e: DragEndEvent) {
        if (!e.over || e.active.id === e.over.id) return;
        const fromIdx = options.findIndex((o) => o.label === e.active.id);
        const toIdx = options.findIndex((o) => o.label === e.over!.id);
        if (fromIdx === -1 || toIdx === -1) return;
        commit({ ...config, options: relabel(arrayMove(options, fromIdx, toIdx)) });
    }

    return (
        <section
            id="sec-body"
            aria-labelledby="sec-body-heading"
            className="mt-2 mb-8 rounded-lg border border-border bg-card p-6"
        >
            <header className="mb-4 flex items-baseline justify-between gap-3">
                <div>
                    <div className="font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                        Section 2
                    </div>
                    <h2
                        id="sec-body-heading"
                        className="mt-0.5 font-display text-[16px] font-semibold tracking-tight text-foreground"
                    >
                        Options
                    </h2>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {mode === 'mcq'
                            ? 'Pick the one correct option.'
                            : 'Toggle every correct option (minimum 2).'}
                    </p>
                </div>
                <span
                    className={cn(
                        'rounded-full border px-2.5 py-0.5 font-mono text-[10.5px]',
                        correctError
                            ? 'border-destructive/40 bg-destructive/10 text-destructive'
                            : 'border-[var(--correct-line)] bg-[var(--correct-bg)] text-[var(--correct-dot)]',
                    )}
                >
                    {correctCount} of {options.length} correct
                </span>
            </header>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext
                    items={options.map((o) => o.label)}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className="space-y-2">
                        {options.map((option, idx) => (
                            <OptionRow
                                key={option.label}
                                option={option}
                                idx={idx}
                                mode={mode}
                                disableDelete={options.length <= MIN_OPTIONS}
                                onToggle={() => toggleCorrect(idx)}
                                onText={(t) => updateText(idx, t)}
                                onDelete={() => removeOption(idx)}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            <button
                type="button"
                onClick={addOption}
                disabled={options.length >= MAX_OPTIONS}
                className="mt-3 flex w-full items-center gap-2 rounded-md border border-dashed border-border bg-transparent px-3 py-2.5 text-left text-[12px] font-medium text-[var(--fg-subtle)] transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-[var(--fg-subtle)]"
            >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                Add option {options.length >= MAX_OPTIONS && `(max ${MAX_OPTIONS})`}
            </button>

            {(correctError || responseError) && (
                <p className="mt-3 text-[11.5px] text-destructive">
                    {responseError ?? correctError}
                </p>
            )}
        </section>
    );
}

interface OptionRowProps {
    option: McqConfig['options'][number];
    idx: number;
    mode: Mode;
    disableDelete: boolean;
    onToggle: () => void;
    onText: (text: string) => void;
    onDelete: () => void;
}

function OptionRow({ option, idx, mode, disableDelete, onToggle, onText, onDelete }: OptionRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: option.label,
    });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                'group flex items-stretch overflow-hidden rounded-md border transition-colors',
                option.is_correct
                    ? 'border-[var(--correct-line)] bg-[var(--correct-bg)]'
                    : 'border-border bg-card hover:border-[var(--border-strong)]',
                isDragging && 'opacity-60 shadow-md',
            )}
        >
            <button
                type="button"
                {...listeners}
                aria-label={`Drag option ${option.label}`}
                title="Drag to reorder"
                className="flex w-8 cursor-grab items-center justify-center text-[var(--fg-subtle)] hover:bg-[var(--bg-raised)] hover:text-muted-foreground active:cursor-grabbing"
            >
                <GripVertical className="h-3.5 w-3.5" aria-hidden />
            </button>

            <button
                type="button"
                onClick={onToggle}
                aria-pressed={option.is_correct}
                aria-label={`Mark option ${option.label} as ${option.is_correct ? 'incorrect' : 'correct'}`}
                className={cn(
                    'flex w-9 shrink-0 items-center justify-center border-x border-border transition-colors',
                    option.is_correct
                        ? 'border-[var(--correct-line)] bg-[var(--correct-bg)]'
                        : 'bg-[var(--bg-raised)] hover:bg-[var(--bg-raised)]/70',
                )}
            >
                <span
                    className={cn(
                        'flex h-4 w-4 items-center justify-center transition-colors',
                        mode === 'mcq' ? 'rounded-full' : 'rounded-[3px]',
                        option.is_correct
                            ? 'border-0 bg-[var(--correct-dot)] text-white'
                            : 'border-[1.5px] border-[var(--border-strong)] bg-transparent',
                    )}
                >
                    {option.is_correct && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                </span>
            </button>

            <span
                aria-hidden
                className={cn(
                    'flex w-7 shrink-0 items-center justify-center border-r border-border font-mono text-[12px] font-semibold',
                    option.is_correct ? 'text-[var(--correct-dot)]' : 'text-muted-foreground',
                )}
            >
                {option.label}
            </span>

            <input
                type="text"
                value={option.text}
                onChange={(e) => onText(e.target.value)}
                placeholder={`Option ${option.label}…`}
                className="flex-1 border-0 bg-transparent px-3 py-2.5 text-[13.5px] text-foreground placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/40"
                aria-label={`Option ${option.label} text`}
            />

            <button
                type="button"
                onClick={onDelete}
                disabled={disableDelete}
                aria-label={`Delete option ${option.label}`}
                title={disableDelete ? `Minimum ${MIN_OPTIONS} options required` : 'Delete option'}
                className="flex w-9 shrink-0 items-center justify-center text-[var(--fg-subtle)] opacity-0 transition-opacity hover:bg-[var(--bg-raised)] hover:text-destructive disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--fg-subtle)] group-hover:opacity-100"
            >
                <X className="h-3.5 w-3.5" aria-hidden />
            </button>
        </li>
    );
}
