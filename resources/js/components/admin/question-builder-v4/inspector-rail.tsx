import { FileText, History, Keyboard, Link2, List, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { findQuestion } from './lib/drill';
import { useBuilderV4Store } from './store/provider';
import type { InspectorTab } from './store/create-store';

interface RailButton {
    key: InspectorTab;
    label: string;
    icon: LucideIcon;
}

const MAIN: RailButton[] = [
    { key: 'links', label: 'Links', icon: Link2 },
    { key: 'contexts', label: 'Contexts', icon: FileText },
    { key: 'ai', label: 'AI assist', icon: Sparkles },
    { key: 'history', label: 'History', icon: History },
];

const STUB_BOTTOM = [
    { key: 'outline', label: 'Outline (CP later)', icon: List },
    { key: 'shortcuts', label: 'Shortcuts (CP later)', icon: Keyboard },
] as const;

export function InspectorRail() {
    const activeTab = useBuilderV4Store((s) => s.inspectorTab);
    const setInspectorTab = useBuilderV4Store((s) => s.setInspectorTab);
    const paper = useBuilderV4Store((s) => s.paper);
    const selectedQuestionId = useBuilderV4Store((s) => s.selectedQuestionId);
    const selectedQuestion = selectedQuestionId ? findQuestion(paper, selectedQuestionId) : null;

    const linksCount =
        (selectedQuestion?.topic_links?.length ?? 0) +
        (selectedQuestion?.question_block_links?.length ?? 0);

    const contextsCount =
        (selectedQuestion?.context_links?.length ?? 0) ||
        (selectedQuestion?.question_context_links?.length ?? 0);

    function badgeCountFor(key: InspectorTab): number {
        if (key === 'links') return linksCount;
        if (key === 'contexts') return contextsCount;
        return 0;
    }

    return (
        <aside className="col-start-4 row-start-2 flex min-h-0 w-13 flex-col items-center gap-1 border-l border-border bg-card py-3">
            {MAIN.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                const count = badgeCountFor(tab.key);
                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setInspectorTab(tab.key)}
                        aria-pressed={isActive}
                        aria-label={count > 0 ? `${tab.label} (${count})` : tab.label}
                        title={tab.label}
                        className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                            isActive
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground/70 hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {count > 0 && (
                            <span
                                aria-hidden
                                className={cn(
                                    'absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full border px-1 font-mono text-[8.5px] font-semibold leading-none',
                                    isActive
                                        ? 'border-foreground/20 bg-foreground text-background'
                                        : 'border-border bg-card text-muted-foreground',
                                )}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}

            <div className="flex-1" />

            {STUB_BOTTOM.map((b) => {
                const Icon = b.icon;
                return (
                    <button
                        key={b.key}
                        type="button"
                        disabled
                        aria-label={b.label}
                        title={b.label}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/40 opacity-70"
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </button>
                );
            })}

            <span
                aria-hidden
                className="mt-1.5 font-mono text-[9.5px] tracking-[0.18em] text-muted-foreground/40 uppercase"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
                Inspector
            </span>
        </aside>
    );
}
