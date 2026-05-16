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

interface MarkTopicCompleteDialogProps {
    topicTitle: string;
    blockCount: number;
    allApproved: boolean;
    onConfirm: () => void;
    disabled?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}

export function MarkTopicCompleteDialog({
    topicTitle,
    blockCount,
    allApproved,
    onConfirm,
    disabled,
    open,
    onOpenChange,
    hideTrigger,
}: MarkTopicCompleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {!hideTrigger && (
                <AlertDialogTrigger asChild>
                    <Button variant="default" disabled={disabled || !allApproved}>Mark topic complete</Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Publish {topicTitle} to students?</AlertDialogTitle>
                    <AlertDialogDescription>
                        All {blockCount} blocks will be published and visible to students at this topic's education level.
                        This action is reversible only by an admin retracting the topic manually.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Publish topic</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
