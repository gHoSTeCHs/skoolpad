import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginatedData } from '@/types/models';

interface PaginationProps {
    meta: PaginatedData<unknown>['meta'];
    links: PaginatedData<unknown>['links'];
}

export function Pagination({ meta, links }: PaginationProps) {
    if (meta.last_page <= 1) {
        return null;
    }

    const from = (meta.current_page - 1) * meta.per_page + 1;
    const to = Math.min(meta.current_page * meta.per_page, meta.total);

    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {from} to {to} of {meta.total} results
            </p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!links.prev} asChild={!!links.prev}>
                    {links.prev ? <Link href={links.prev}>Previous</Link> : <span>Previous</span>}
                </Button>
                <Button variant="outline" size="sm" disabled={!links.next} asChild={!!links.next}>
                    {links.next ? <Link href={links.next}>Next</Link> : <span>Next</span>}
                </Button>
            </div>
        </div>
    );
}
