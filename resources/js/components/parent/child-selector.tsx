import { ChevronDown, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LinkedChild } from '@/types/parent';

interface ChildSelectorProps {
    children: LinkedChild[];
    selectedChildId: string | null;
    onSelect: (id: string) => void;
}

export function ChildSelector({ children, selectedChildId, onSelect }: ChildSelectorProps) {
    const selected = children.find((c) => c.student_profile_id === selectedChildId) ?? children[0];

    if (!selected) {
        return null;
    }

    const initial = selected.student_profile?.user?.name?.charAt(0)?.toUpperCase() ?? '?';
    const name = selected.student_profile?.user?.name ?? 'Child';

    if (children.length <= 1) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--canopy-100)] text-sm font-bold text-[var(--canopy-700)]">
                    {initial}
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{children.length} child linked</p>
                </div>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-muted"
                    data-testid="child-selector"
                >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--canopy-100)] text-sm font-bold text-[var(--canopy-700)]">
                        {initial}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{children.length} children linked</p>
                    </div>
                    <ChevronDown className="ml-2 size-4 text-muted-foreground" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {children.map((child) => {
                    const childName = child.student_profile?.user?.name ?? 'Child';
                    const childInitial = childName.charAt(0).toUpperCase();
                    const isSelected = child.student_profile_id === selectedChildId;

                    return (
                        <DropdownMenuItem
                            key={child.id}
                            onSelect={() => onSelect(child.student_profile_id)}
                            className={isSelected ? 'bg-muted font-medium' : ''}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--canopy-100)] text-xs font-bold text-[var(--canopy-700)]">
                                    {childInitial}
                                </div>
                                <span>{childName}</span>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
