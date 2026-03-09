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
import type { SessionPeriod } from '@/hooks/use-weekly-schedule';
import { GraduationCap } from 'lucide-react';

interface SessionSetupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (session: SessionPeriod) => void;
    initialSession?: SessionPeriod | null;
}

export function SessionSetupModal({
    open,
    onOpenChange,
    onSave,
    initialSession,
}: SessionSetupModalProps) {
    const [label, setLabel] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isEditing = !!initialSession?.label;

    useEffect(() => {
        if (open) {
            setLabel(initialSession?.label ?? '');
            setStartDate(initialSession?.startDate ?? '');
            setEndDate(initialSession?.endDate ?? '');
        }
    }, [open, initialSession]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSave({ label: label.trim(), startDate, endDate });
        onOpenChange(false);
    }

    const isValid = label.trim() && startDate && endDate && endDate >= startDate;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
                            <GraduationCap className="size-4" />
                        </span>
                        {isEditing ? 'Edit Session Period' : 'Set Session Period'}
                    </DialogTitle>
                    <DialogDescription className="font-body">
                        Define the date range for your academic session.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="mt-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="session-label" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Session Label <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="session-label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Second Semester 2025/2026"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="session-start" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Start Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="session-start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="session-end" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    End Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="session-end"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid}
                        >
                            Save Session
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
