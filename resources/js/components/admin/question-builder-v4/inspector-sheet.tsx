import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useBuilderV4Store } from './store/provider';
import type { InspectorTab } from './store/create-store';

const TAB_META: Record<InspectorTab, { title: string; landingCp: string; blurb: string }> = {
    links: {
        title: 'Links',
        landingCp: 'CP6',
        blurb: 'Topic + block linking with AI suggestions arrives in Checkpoint 6.',
    },
    contexts: {
        title: 'Contexts',
        landingCp: 'CP7',
        blurb: 'Attach shared contexts to a question, or compose a new one inline. Arrives in Checkpoint 7.',
    },
    ai: {
        title: 'AI assist',
        landingCp: 'CP10',
        blurb: 'Quick prompts (rewrite stem, suggest distractors, draft answer outline). Arrives in Checkpoint 10.',
    },
    history: {
        title: 'History',
        landingCp: 'CP10',
        blurb: 'Generation log + edit timeline for the active question. Arrives in Checkpoint 10.',
    },
};

export function InspectorSheet() {
    const activeTab = useBuilderV4Store((s) => s.inspectorTab);
    const setInspectorTab = useBuilderV4Store((s) => s.setInspectorTab);

    const meta = activeTab ? TAB_META[activeTab] : null;

    return (
        <Sheet open={!!activeTab} onOpenChange={(next) => !next && setInspectorTab(null)}>
            <SheetContent side="right" className="w-[400px] gap-0 sm:max-w-[400px]">
                <SheetHeader className="border-b border-border px-5 pt-5 pb-3">
                    <SheetTitle className="font-display text-[14px] font-semibold tracking-tight">
                        {meta?.title ?? ''}
                    </SheetTitle>
                </SheetHeader>

                {meta && (
                    <div className="px-5 py-6">
                        <div className="inline-flex h-6 items-center rounded border border-border bg-[var(--bg-raised)] px-2 font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                            {meta.landingCp}
                        </div>
                        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                            {meta.blurb}
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
