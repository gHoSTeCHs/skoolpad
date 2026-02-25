import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import QuestionContextController from '@/actions/App/Http/Controllers/Admin/QuestionContextController';
import type { QuestionContextData, QuestionNode } from '@/types/questions';

interface ContextPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contexts: QuestionContextData[];
    question: QuestionNode;
}

/**
 * Extracts the set of linked context IDs from a question node,
 * handling both the API resource format (context_links) and the
 * raw Eloquent serialization format (question_context_links).
 */
function getLinkedContextIds(question: QuestionNode): Set<string> {
    if (question.context_links?.length) {
        return new Set(question.context_links.map((cl) => cl.context_id));
    }
    if (question.question_context_links?.length) {
        return new Set(question.question_context_links.map((cl) => cl.question_context_id));
    }
    return new Set();
}

export default function ContextPicker({ open, onOpenChange, contexts, question }: ContextPickerProps) {
    const linkedContextIds = getLinkedContextIds(question);

    function handleToggle(contextId: string) {
        if (linkedContextIds.has(contextId)) {
            router.delete(
                QuestionContextController.unlink.url({
                    question: question.id,
                    questionContext: contextId,
                }),
                {
                    preserveScroll: true,
                    onSuccess: () => router.reload({ only: ['paper'] }),
                }
            );
        } else {
            router.post(
                QuestionContextController.link.url(question.id),
                { context_id: contextId },
                {
                    preserveScroll: true,
                    onSuccess: () => router.reload({ only: ['paper'] }),
                }
            );
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Link Contexts</DialogTitle>
                    <DialogDescription>
                        Toggle contexts to link or unlink from this question.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-60 space-y-2 overflow-y-auto">
                    {contexts.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No contexts available. Add a context first.
                        </p>
                    )}

                    {contexts.map((ctx) => {
                        const isLinked = linkedContextIds.has(ctx.id);
                        return (
                            <div
                                key={ctx.id}
                                className={
                                    'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-accent'
                                    + (isLinked ? ' border-primary bg-primary/5' : ' border-border')
                                }
                                onClick={() => handleToggle(ctx.id)}
                            >
                                <div className={
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-[10px] font-bold'
                                    + (isLinked ? ' border-primary bg-primary text-primary-foreground' : ' border-muted-foreground/30')
                                }>
                                    {isLinked ? '\u2713' : ''}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <span className="text-sm font-medium">
                                        {ctx.title || 'Untitled'}
                                    </span>
                                    <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                                        {ctx.context_type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
