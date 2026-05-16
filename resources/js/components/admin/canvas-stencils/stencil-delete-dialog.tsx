import { router } from '@inertiajs/react';
import { useState } from 'react';

import CanvasStencilController from '@/actions/App/Http/Controllers/Admin/CanvasStencilController';
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

import type { StencilRow } from './stencils-filter-store';

interface StencilDeleteDialogProps {
    stencil: StencilRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StencilDeleteDialog({ stencil, open, onOpenChange }: StencilDeleteDialogProps) {
    const [deleting, setDeleting] = useState(false);

    function handleDelete() {
        if (!stencil) return;
        setDeleting(true);
        router.delete(
            CanvasStencilController.destroy.url({ canvasStencil: stencil.id }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setDeleting(false);
                    onOpenChange(false);
                },
            },
        );
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-display">
                        Delete &ldquo;{stencil?.name}&rdquo;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Authors will no longer see this stencil in the Excalidraw modal sidebar.
                        Diagrams already drawn using this stencil are unaffected — they reference a
                        snapshot of the SVG embedded inline, not the live stencil row.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="stencil-delete-confirm"
                    >
                        {deleting ? 'Deleting…' : 'Delete stencil'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
