import { Pencil, Info, AlertTriangle, History, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InspectorTab = 'guidance' | 'metadata' | 'advisory' | 'history';

interface InspectorPeekProps {
    activeTab: InspectorTab | null;
    onTabClick: (tab: InspectorTab) => void;
    hasAdvisory?: boolean;
    enabled?: boolean;
}

interface TabDef {
    key: InspectorTab;
    label: string;
    icon: LucideIcon;
}

const TABS: TabDef[] = [
    { key: 'guidance', label: 'Guidance', icon: Pencil },
    { key: 'metadata', label: 'Metadata', icon: Info },
    { key: 'advisory', label: 'Drift advisory', icon: AlertTriangle },
    { key: 'history', label: 'History', icon: History },
];

export function InspectorPeek({ activeTab, onTabClick, hasAdvisory = false, enabled = true }: InspectorPeekProps) {
    return (
        <aside className="flex h-full w-11 flex-col items-center gap-1 border-l border-border bg-card py-3">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                const showDot = tab.key === 'advisory' && hasAdvisory;
                const isClickable = enabled;

                return (
                    <button
                        key={tab.key}
                        type="button"
                        disabled={!isClickable}
                        onClick={() => isClickable && onTabClick(tab.key)}
                        aria-pressed={isActive}
                        aria-label={isClickable ? tab.label : `${tab.label} · select a block first`}
                        title={isClickable ? tab.label : `${tab.label} (select a block first)`}
                        className={cn(
                            'relative flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                            isActive
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground/70 hover:bg-muted hover:text-foreground',
                            !isClickable && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {showDot && (
                            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--badge-danger-bg)]" />
                        )}
                    </button>
                );
            })}
            <span
                className="mt-1.5 text-[10.5px] font-medium tracking-wider text-muted-foreground/60"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
                Inspector
            </span>
        </aside>
    );
}
