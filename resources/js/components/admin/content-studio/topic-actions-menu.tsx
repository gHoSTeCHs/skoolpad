import { CheckCircle, MoreHorizontal, RotateCcw } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TopicActionsMenuProps {
    onMarkCompleteClick: () => void;
    onResetClick: () => void;
    disabled?: boolean;
    canMarkComplete?: boolean;
}

export function TopicActionsMenu({
    onMarkCompleteClick,
    onResetClick,
    disabled = false,
    canMarkComplete = true,
}: TopicActionsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground',
                        disabled && 'opacity-50',
                    )}
                    aria-label="More topic actions"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Topic actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                    disabled={!canMarkComplete}
                    onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(onMarkCompleteClick, 0);
                    }}
                >
                    <CheckCircle className="mr-2 h-3.5 w-3.5" />
                    Mark complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                        e.preventDefault();
                        setTimeout(onResetClick, 0);
                    }}
                >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Reset topic
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
