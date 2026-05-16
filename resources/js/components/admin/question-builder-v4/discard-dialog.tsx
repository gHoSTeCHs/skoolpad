import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBuilderV4Store } from './store/provider';

export function DiscardDialog() {
    const pendingNav = useBuilderV4Store((s) => s.pendingNav);
    const confirmDiscard = useBuilderV4Store((s) => s.confirmDiscard);
    const cancelDiscard = useBuilderV4Store((s) => s.cancelDiscard);

    const open = pendingNav !== null;

    return (
        <AlertDialog open={open} onOpenChange={(next) => !next && cancelDiscard()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-display">Unsaved changes</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unsaved edits on this question. Discard them and continue, or stay and
                        save first?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={cancelDiscard}>Stay and save</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDiscard}>
                        Discard and continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
