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
import type { ExamPeriod } from '@/hooks/use-exam-period';
import { ClipboardList } from 'lucide-react';

interface ExamPeriodSetupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (period: ExamPeriod) => void;
    initialPeriod?: ExamPeriod | null;
}

export function ExamPeriodSetupModal({
    open,
    onOpenChange,
    onSave,
    initialPeriod,
}: ExamPeriodSetupModalProps) {
    const [label, setLabel] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isEditing = !!initialPeriod?.label;

    useEffect(() => {
        if (open) {
            setLabel(initialPeriod?.label ?? '');
            setStartDate(initialPeriod?.startDate ?? '');
            setEndDate(initialPeriod?.endDate ?? '');
        }
    }, [open, initialPeriod]);

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
                        <span
                            className="flex size-7 items-center justify-center rounded-lg"
                            style={{ background: 'var(--destructive)' + '18', color: 'var(--destructive)' }}
                        >
                            <ClipboardList className="size-4" />
                        </span>
                        {isEditing ? 'Edit Exam Period' : 'Set Exam Period'}
                    </DialogTitle>
                    <DialogDescription className="font-body">
                        Define the date range for your upcoming exams.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="mt-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="period-label" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Period Label <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="period-label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Second Semester Finals"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="period-start" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Start Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="period-start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="period-end" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    End Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="period-end"
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
                            style={{ background: 'var(--destructive)' }}
                        >
                            Save Period
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
