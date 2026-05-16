import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { findQuestion } from './lib/drill';
import { LinksInspector } from './links-inspector';
import { useBuilderV4Store } from './store/provider';
import type { InspectorTab } from './store/create-store';

const TAB_META: Record<InspectorTab, { title: string; landingCp: string; blurb: string }> = {
    links: {
        title: 'Links',
        landingCp: 'CP6',
        blurb: 'Topic + block linking. Lands in Checkpoint 6.',
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
    const paper = useBuilderV4Store((s) => s.paper);
    const selectedQuestionId = useBuilderV4Store((s) => s.selectedQuestionId);
    const selectedQuestion = selectedQuestionId ? findQuestion(paper, selectedQuestionId) : null;

    const meta = activeTab ? TAB_META[activeTab] : null;

    return (
        <Sheet open={!!activeTab} onOpenChange={(next) => !next && setInspectorTab(null)}>
            <SheetContent side="right" className="w-[400px] gap-0 sm:max-w-[400px]">
                <SheetHeader className="border-b border-border px-5 pt-5 pb-3">
                    <SheetTitle className="font-display text-[14px] font-semibold tracking-tight">
                        {meta?.title ?? ''}
                    </SheetTitle>
                </SheetHeader>

                {activeTab === 'links' && selectedQuestion ? (
                    <div className="flex-1 overflow-y-auto">
                        <LinksInspector key={selectedQuestion.id} question={selectedQuestion} />
                    </div>
                ) : activeTab && !selectedQuestion ? (
                    <EmptyTabState message="Select a question to use this panel." />
                ) : meta ? (
                    <PlaceholderTab landingCp={meta.landingCp} blurb={meta.blurb} />
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

function PlaceholderTab({ landingCp, blurb }: { landingCp: string; blurb: string }) {
    return (
        <div className="px-5 py-6">
            <div className="inline-flex h-6 items-center rounded border border-border bg-[var(--bg-raised)] px-2 font-mono text-[10px] tracking-[0.16em] text-[var(--fg-subtle)] uppercase">
                {landingCp}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{blurb}</p>
        </div>
    );
}

function EmptyTabState({ message }: { message: string }) {
    return (
        <div className="flex flex-1 items-center justify-center px-5 py-10">
            <p className="text-center text-[12.5px] text-muted-foreground">{message}</p>
        </div>
    );
}
