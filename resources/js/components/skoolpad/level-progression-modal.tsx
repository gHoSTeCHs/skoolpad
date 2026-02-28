import { router } from '@inertiajs/react';
import { ArrowUp, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LevelProgressionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentLevel: string;
    nextLevel: string;
    updateUrl: string;
    nextLevelId: string;
}

export default function LevelProgressionModal({
    open,
    onOpenChange,
    currentLevel,
    nextLevel,
    updateUrl,
    nextLevelId,
}: LevelProgressionModalProps) {
    const [processing, setProcessing] = useState(false);

    function handleProgress() {
        setProcessing(true);
        router.post(updateUrl, { education_level_id: nextLevelId }, {
            onFinish: () => {
                setProcessing(false);
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-display">Class Level Update</DialogTitle>
                    <DialogDescription>
                        Are you still in <strong>{currentLevel}</strong> or have you moved to <strong>{nextLevel}</strong>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        <Check className="mr-2 size-4" />
                        Still in {currentLevel}
                    </Button>
                    <Button onClick={handleProgress} disabled={processing}>
                        <ArrowUp className="mr-2 size-4" />
                        Moved to {nextLevel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
