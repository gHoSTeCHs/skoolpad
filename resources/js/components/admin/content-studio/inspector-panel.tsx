import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { DriftAdvisoryBanner } from './drift-advisory-banner';
import { BlockMetadataPanel } from './block-metadata-panel';
import type { ContentBlock, GenerationLogEntry } from '@/types/content-studio';
import type { InspectorTab } from './inspector-peek';

interface InspectorPanelProps {
    open: boolean;
    tab: InspectorTab | null;
    block: ContentBlock | null;
    blockHistory: GenerationLogEntry[];
    historyLinkageAvailable: boolean;
    onClose: () => void;
    onUpdateGuidance: (guidance: string) => Promise<void>;
    onDismissAdvisory: () => void;
    onRegenerate: () => void;
    isBusy: boolean;
}

export function InspectorPanel({
    open,
    tab,
    block,
    blockHistory,
    historyLinkageAvailable,
    onClose,
    onUpdateGuidance,
    onDismissAdvisory,
    onRegenerate,
    isBusy,
}: InspectorPanelProps) {
    return (
        <Sheet open={open && !!tab && !!block} onOpenChange={(next) => !next && onClose()}>
            <SheetContent side="right" className="w-[380px] sm:w-[380px]">
                <SheetHeader>
                    <SheetTitle className="font-display capitalize">{tab ?? ''}</SheetTitle>
                </SheetHeader>

                <div className="mt-4 max-h-[calc(100vh-6rem)] overflow-y-auto px-6">
                    {tab === 'guidance' && block && (
                        <GuidanceSection block={block} onSave={onUpdateGuidance} disabled={isBusy} />
                    )}
                    {tab === 'metadata' && block && <BlockMetadataPanel block={block} variant="inspector" />}
                    {tab === 'advisory' && block && (
                        <AdvisorySection
                            block={block}
                            onDismiss={onDismissAdvisory}
                            onRegenerate={onRegenerate}
                            isBusy={isBusy}
                        />
                    )}
                    {tab === 'history' && (
                        <HistorySection entries={blockHistory} linkageAvailable={historyLinkageAvailable} />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function GuidanceSection({
    block,
    onSave,
    disabled,
}: {
    block: ContentBlock;
    onSave: (guidance: string) => Promise<void>;
    disabled: boolean;
}) {
    const [draft, setDraft] = useState(block.content_guidance ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDraft(block.content_guidance ?? '');
    }, [block.id, block.content_guidance]);

    async function handleSave() {
        if (!draft.trim()) return;
        setSaving(true);
        try {
            await onSave(draft.trim());
        } finally {
            setSaving(false);
        }
    }

    const dirty = draft !== (block.content_guidance ?? '');

    return (
        <div className="space-y-3">
            <p className="text-[12.5px] text-muted-foreground">
                Describe what this block should cover — scope, key concepts, examples, depth level.
            </p>
            <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={10}
                disabled={disabled || saving}
                className="w-full resize-y rounded-md border border-border bg-background p-3 text-[13.5px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="What should this block cover?"
            />
            <div className="flex items-center justify-end gap-2">
                <Button size="sm" onClick={handleSave} disabled={!draft.trim() || saving || !dirty}>
                    {saving ? 'Saving…' : 'Save guidance'}
                </Button>
            </div>
        </div>
    );
}

function AdvisorySection({
    block,
    onDismiss,
    onRegenerate,
    isBusy,
}: {
    block: ContentBlock;
    onDismiss: () => void;
    onRegenerate: () => void;
    isBusy: boolean;
}) {
    if (!block.drift_advisory) {
        return <p className="text-[13px] text-muted-foreground">No drift advisory.</p>;
    }
    return (
        <DriftAdvisoryBanner
            advisory={block.drift_advisory}
            onDismiss={onDismiss}
            onRegenerate={onRegenerate}
            isBusy={isBusy}
        />
    );
}

function HistorySection({ entries, linkageAvailable }: { entries: GenerationLogEntry[]; linkageAvailable: boolean }) {
    if (!linkageAvailable) {
        return (
            <p className="text-[13px] text-muted-foreground">
                Per-block history activates after the next backend update. Older logs aren&rsquo;t linked to specific
                blocks yet.
            </p>
        );
    }
    if (entries.length === 0) {
        return <p className="text-[13px] text-muted-foreground">No generation history for this block.</p>;
    }
    return (
        <ul className="space-y-3 text-[12.5px]">
            {entries.map((e) => (
                <li key={e.id} className="rounded-md border border-border bg-background p-3">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{e.model_used || '—'}</span>
                        <span className="tech">{new Date(e.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-muted-foreground">
                        <span className="tech">{e.tokens_used.toLocaleString()} tokens</span>
                        {e.is_valid ? (
                            <span className="text-[var(--badge-reward-fg)]">valid</span>
                        ) : (
                            <span className="text-[var(--badge-danger-fg)]">invalid</span>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
