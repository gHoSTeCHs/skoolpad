import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ResetTopicDialogProps {
    topicTitle: string;
    topicSlug: string;
    onConfirm: (confirmSlug: string) => void;
    disabled?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}

export function ResetTopicDialog({
    topicTitle,
    topicSlug,
    onConfirm,
    disabled,
    open,
    onOpenChange,
    hideTrigger,
}: ResetTopicDialogProps) {
    const [typed, setTyped] = useState('');
    const canConfirm = typed === topicSlug;

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!next) setTyped('');
                onOpenChange?.(next);
            }}
        >
            {!hideTrigger && (
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={disabled}>Reset topic</Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset all content for {topicTitle}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This clears content, contract metadata, advisories, and the topic's glossary for every block.
                        The topic will be unpublished if it was previously published. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-2 py-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Type <span className="text-foreground">{topicSlug}</span> to confirm
                    </span>
                    <Input
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder={topicSlug}
                        className="font-mono"
                        autoFocus
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => canConfirm && onConfirm(typed)}
                        disabled={!canConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Reset topic
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
