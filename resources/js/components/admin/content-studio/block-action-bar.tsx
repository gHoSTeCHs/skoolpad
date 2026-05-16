import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RegenerateWithConfirm } from './regenerate-with-confirm';
import type { ContentBlock } from '@/types/content-studio';

interface BlockActionBarProps {
    block: ContentBlock;
    isEditing: boolean;
    busy: boolean;
    onSave: () => void;
    onSaveAndApprove: () => void;
    onApprove: () => void;
    onRegenerate: () => void;
    onStartEdit: () => void;
}

export function BlockActionBar({
    block,
    isEditing,
    busy,
    onSave,
    onSaveAndApprove,
    onApprove,
    onRegenerate,
    onStartEdit,
}: BlockActionBarProps) {
    const status = block.generation_status;
    const wordCount = block.word_count ?? 0;
    const readTime = block.estimated_read_time ?? 0;
    const termCount = block.key_terms_introduced?.length ?? 0;
    const formulaCount = block.formulas_used?.length ?? 0;

    return (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card/95 px-6 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                {wordCount > 0 && <span className="tech">{wordCount} words</span>}
                {readTime > 0 && (
                    <>
                        <span className="text-muted-foreground/60">·</span>
                        <span>{readTime} min read</span>
                    </>
                )}
                {(termCount > 0 || formulaCount > 0) && (
                    <>
                        <span className="text-muted-foreground/60">·</span>
                        <span>
                            {formulaCount} formulas, {termCount} key terms
                        </span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                <RegenerateWithConfirm
                    variant="ghost"
                    destructive={status === 'approved'}
                    onConfirm={onRegenerate}
                    disabled={busy}
                />

                {status === 'approved' && !isEditing ? (
                    <Button variant="outline" onClick={onStartEdit} disabled={busy}>
                        Edit
                    </Button>
                ) : (
                    <>
                        <Button variant="outline" onClick={onSave} disabled={busy}>
                            Save draft
                        </Button>
                        <Button variant="outline" onClick={onSaveAndApprove} disabled={busy}>
                            Save + Approve
                        </Button>
                        <Button onClick={onApprove} disabled={busy}>
                            <Check className="mr-1 h-3.5 w-3.5" strokeWidth={2.5} />
                            Approve
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
