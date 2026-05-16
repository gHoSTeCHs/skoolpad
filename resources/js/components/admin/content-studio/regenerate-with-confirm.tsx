import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface RegenerateWithConfirmProps {
    onConfirm: () => void;
    destructive?: boolean;
    disabled?: boolean;
    variant?: 'outline' | 'ghost' | 'destructive';
    label?: string;
}

export function RegenerateWithConfirm({
    onConfirm,
    destructive = false,
    disabled = false,
    variant,
    label = 'Regenerate',
}: RegenerateWithConfirmProps) {
    const buttonVariant = variant ?? (destructive ? 'destructive' : 'outline');
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant={buttonVariant} disabled={disabled}>
                    <RotateCw className="mr-1 h-3.5 w-3.5" />
                    {label}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate this block?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {destructive
                            ? 'This approved block will drop to the generated state and may flag downstream blocks if its key terms, symbols, or summary change.'
                            : 'The current content will be replaced.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Regenerate</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
