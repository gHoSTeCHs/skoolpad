import { Link } from '@inertiajs/react';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RowAction {
    label: string;
    href: string;
}

interface RowActionsProps {
    editUrl: string;
    actions?: RowAction[];
}

export function RowActions({ editUrl, actions }: RowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={editUrl}>
                        <Pencil className="size-4" />
                        Edit
                    </Link>
                </DropdownMenuItem>
                {actions?.map((action) => (
                    <DropdownMenuItem key={action.href} asChild>
                        <Link href={action.href}>{action.label}</Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
