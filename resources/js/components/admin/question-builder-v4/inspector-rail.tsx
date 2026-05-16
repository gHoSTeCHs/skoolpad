import { FileText, History, Keyboard, Link2, List, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    { key: 'outline', label: 'Outline (CPlater)', icon: List },
    { key: 'shortcuts', label: 'Shortcuts (CP later)', icon: Keyboard },
] as const;

export function InspectorRail() {
    const activeTab = useBuilderV4Store((s) => s.inspectorTab);
    const setInspectorTab = useBuilderV4Store((s) => s.setInspectorTab);

    return (
        <aside className="col-start-4 row-start-2 flex min-h-0 w-13 flex-col items-center gap-1 border-l border-border bg-card py-3">
            {MAIN.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setInspectorTab(tab.key)}
                        aria-pressed={isActive}
                        aria-label={tab.label}
                        title={tab.label}
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                            isActive
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground/70 hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
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
