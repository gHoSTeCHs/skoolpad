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
import { Checkbox } from '@/components/ui/checkbox';
import type { ResolvedStageModel } from '@/types/content-studio';

interface GenerateAllBlocksDialogProps {
    topicTitle: string;
    blockCount: number;
    notStartedCount: number;
    resolvedModel: ResolvedStageModel;
    onConfirm: (forceRegenerate: boolean) => void;
    disabled?: boolean;
}

export function GenerateAllBlocksDialog({
    topicTitle,
    blockCount,
    notStartedCount,
    resolvedModel,
    onConfirm,
    disabled,
}: GenerateAllBlocksDialogProps) {
    const [force, setForce] = useState(false);
    const estimatedMinutes = Math.ceil((force ? blockCount : notStartedCount) * 0.75);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={disabled || (notStartedCount === 0 && !force)}>Generate All Blocks</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Generate content for all blocks in {topicTitle}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Blocks will be generated sequentially, passing each previous block's summary and glossary
                        forward as context. {notStartedCount} of {blockCount} blocks have not been started.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-3 py-2">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Model</span>
                        <span className="text-sm text-foreground">{resolvedModel.name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">· {resolvedModel.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Estimated</span>
                        <span className="text-sm text-foreground">~{estimatedMinutes} min</span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox checked={force} onCheckedChange={(v) => setForce(Boolean(v))} />
                        Include already-generated and approved blocks (force regenerate all)
                    </label>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm(force)} disabled={disabled}>Start generation</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
