import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarDays, Plus } from 'lucide-react';

export interface CalendarEntryType {
    key: string;
    label: string;
    icon: LucideIcon;
    color: string;
    dotClass: string;
}

export interface CalendarEntryData {
    typeKey: string;
    title: string;
    date: string;
    time: string;
    notes: string;
    [key: string]: unknown;
}

export interface ExistingEntry {
    title: string;
    typeKey: string;
    time?: string;
    notes?: string;
    [key: string]: unknown;
}

interface CalendarEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entryTypes: CalendarEntryType[];
    initialDate?: string;
    initialEntry?: Partial<CalendarEntryData>;
    existingEntries?: ExistingEntry[];
    onSave: (entry: CalendarEntryData) => void;
    onEntryClick?: (entry: ExistingEntry) => void;
    renderExtraFields?: (typeKey: string, data: CalendarEntryData, onChange: (field: string, value: unknown) => void) => React.ReactNode;
    title?: string;
    description?: string;
    children?: React.ReactNode;
}

function formatDisplayDate(dateKey: string): string {
    if (!dateKey) return '';
    const d = new Date(dateKey + 'T00:00:00');
    return d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function makeEmptyData(typeKey: string, date: string, initialEntry?: Partial<CalendarEntryData>): CalendarEntryData {
    return {
        typeKey: initialEntry?.typeKey ?? typeKey,
        title: initialEntry?.title ?? '',
        date: initialEntry?.date ?? date,
        time: initialEntry?.time ?? '',
        notes: initialEntry?.notes ?? '',
        ...initialEntry,
    };
}

export function CalendarEntryModal({
    open,
    onOpenChange,
    entryTypes,
    initialDate,
    initialEntry,
    existingEntries,
    onSave,
    onEntryClick,
    renderExtraFields,
    title,
    description,
    children,
}: CalendarEntryModalProps) {
    const isEditing = !!initialEntry?.title;
    const defaultType = entryTypes[0]?.key ?? '';
    const hasExisting = existingEntries && existingEntries.length > 0;
    const hasViewContent = hasExisting || !!children;

    const [mode, setMode] = useState<'view' | 'add'>(hasViewContent ? 'view' : 'add');
    const [data, setData] = useState<CalendarEntryData>(() =>
        makeEmptyData(defaultType, initialDate ?? '', initialEntry),
    );

    useEffect(() => {
        if (open) {
            setData(makeEmptyData(defaultType, initialDate ?? '', initialEntry));
            setMode(hasViewContent ? 'view' : 'add');
        }
    }, [open, initialDate]);

    function handleChange(field: string, value: unknown) {
        setData((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSave(data);
        setData(makeEmptyData(defaultType, initialDate ?? ''));
        setMode('view');
    }

    function handleSwitchToAdd() {
        setData(makeEmptyData(defaultType, initialDate ?? ''));
        setMode('add');
    }

    const selectedType = entryTypes.find((t) => t.key === data.typeKey);
    const displayDate = formatDisplayDate(initialDate ?? data.date);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                        {mode === 'add' && selectedType ? (
                            <span
                                className="flex size-7 items-center justify-center rounded-lg"
                                style={{ background: selectedType.color + '18', color: selectedType.color }}
                            >
                                <selectedType.icon className="size-4" />
                            </span>
                        ) : (
                            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CalendarDays className="size-4" />
                            </span>
                        )}
                        {mode === 'add'
                            ? (title ?? (isEditing ? 'Edit Entry' : 'New Entry'))
                            : 'Day Overview'
                        }
                    </DialogTitle>
                    {displayDate && (
                        <DialogDescription className="font-body">
                            {mode === 'add' && description
                                ? description
                                : displayDate
                            }
                        </DialogDescription>
                    )}
                </DialogHeader>

                {mode === 'view' ? (
                    <div className="mt-2">
                        {hasExisting ? (
                            <div className="space-y-1.5">
                                {existingEntries.map((entry, i) => {
                                    const type = entryTypes.find((t) => t.key === entry.typeKey);
                                    return (
                                        <button
                                            key={`${entry.typeKey}-${entry.title}-${i}`}
                                            type="button"
                                            onClick={() => onEntryClick?.(entry)}
                                            className={cn(
                                                'flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-accent/50',
                                                onEntryClick ? 'cursor-pointer' : 'cursor-default',
                                            )}
                                        >
                                            {type && (
                                                <span
                                                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                                                    style={{ background: type.color + '14', color: type.color }}
                                                >
                                                    <type.icon className="size-4" />
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-semibold">{entry.title}</span>
                                                    {type && (
                                                        <span
                                                            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                                                            style={{ background: type.color + '14', color: type.color }}
                                                        >
                                                            {type.label}
                                                        </span>
                                                    )}
                                                </div>
                                                {(entry.time || entry.notes) && (
                                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                                        {entry.time && <span>{entry.time}</span>}
                                                        {entry.time && entry.notes && <span>·</span>}
                                                        {entry.notes && <span className="line-clamp-1">{entry.notes}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : !children ? (
                            <div className="flex flex-col items-center gap-2 py-6 text-center">
                                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                    <CalendarDays className="size-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">No entries for this day.</p>
                            </div>
                        ) : null}

                        {children}

                        <div className="mt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                            <Button type="button" onClick={handleSwitchToAdd} className="gap-1.5">
                                <Plus className="size-3.5" />
                                Add Entry
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mt-2 space-y-4">
                            {entryTypes.length > 1 && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Type
                                    </Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {entryTypes.map((type) => {
                                            const isActive = data.typeKey === type.key;
                                            return (
                                                <button
                                                    key={type.key}
                                                    type="button"
                                                    onClick={() => handleChange('typeKey', type.key)}
                                                    className={cn(
                                                        'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                                                        isActive
                                                            ? 'border-transparent shadow-sm'
                                                            : 'border-border bg-transparent text-muted-foreground hover:border-border hover:bg-accent/50',
                                                    )}
                                                    style={isActive ? { background: type.color + '14', color: type.color, borderColor: type.color + '40' } : undefined}
                                                >
                                                    <type.icon className="size-3.5" />
                                                    {type.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="entry-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Title <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="entry-title"
                                    value={data.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder={selectedType ? `e.g. ${selectedType.label} name...` : 'Entry title...'}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="entry-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Date <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="entry-date"
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => handleChange('date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="entry-time" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Time
                                    </Label>
                                    <Input
                                        id="entry-time"
                                        type="time"
                                        value={data.time}
                                        onChange={(e) => handleChange('time', e.target.value)}
                                    />
                                </div>
                            </div>

                            {renderExtraFields?.(data.typeKey, data, handleChange)}

                            <div className="space-y-2">
                                <Label htmlFor="entry-notes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Notes
                                </Label>
                                <Textarea
                                    id="entry-notes"
                                    value={data.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    placeholder="Optional notes..."
                                    className="min-h-[72px] resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            {hasViewContent && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setMode('view')}
                                    className="mr-auto text-xs text-muted-foreground"
                                >
                                    Back to overview
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!data.title.trim() || !data.date}
                                style={selectedType ? { background: selectedType.color } : undefined}
                            >
                                {isEditing ? 'Save Changes' : 'Add Entry'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
